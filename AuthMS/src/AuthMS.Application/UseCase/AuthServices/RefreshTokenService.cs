using Application.Dtos.Request;
using Application.Dtos.Response;
using Application.Exceptions;
using Application.Interfaces.ICommand;
using Application.Interfaces.IQuery;
using Application.Interfaces.IServices;
using Application.Interfaces.IServices.IAuthServices;
using Domain.Entities;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.UseCase.AuthServices
{
    public class RefreshTokenService : IRefreshTokenService
    {
        private readonly IAuthTokenService _authTokenService;        
        private readonly IRefreshTokenCommand _refreshTokenCommand;
        private readonly IRefreshTokenQuery _refreshTokenQuery;
        private readonly IUserQuery _userQuery;
        private readonly int _idleTimeoutMinutes;
        private readonly ITimeProvider _timeProvider;
        private readonly IRefreshTokenHasher _refreshTokenHasher;
        private readonly IConfiguration _configuration;

        public RefreshTokenService(
            IAuthTokenService authTokenService,
            IRefreshTokenCommand refreshTokenCommand,
            IRefreshTokenQuery refreshTokenQuery,
            IUserQuery userQuery,
            IConfiguration configuration,
            ITimeProvider timeProvider,
            IRefreshTokenHasher refreshTokenHasher)
        {
            _authTokenService = authTokenService;            
            _refreshTokenCommand = refreshTokenCommand;
            _refreshTokenQuery = refreshTokenQuery;
            _userQuery = userQuery;
            _timeProvider = timeProvider;
            _refreshTokenHasher = refreshTokenHasher;
            _configuration = configuration;
            _idleTimeoutMinutes = configuration.GetValue<int>("RefreshTokenSettings:IdleTimeoutMinutes", 15);
        }

        public async Task<LoginResponse> RefreshAccessToken(RefreshTokenRequest request)
        {
            var now = _timeProvider.Now;
            var principal = GetPrincipalFromExpiredToken(request.ExpiredAccessToken);
            var tokenUserId = GetUserIdFromPrincipal(principal);
            if (tokenUserId == null)
            {
                throw new InvalidRefreshTokenException("El Access Token expirado es inválido.");
            }

            var refreshToken = await _refreshTokenQuery.GetByToken(request.RefreshToken);

            if (refreshToken == null || !refreshToken.IsActive)
            {
                throw new InvalidRefreshTokenException("El Refresh Token no existe o es invalido");
            }

            if (refreshToken.UserId != tokenUserId.Value)
            {
                await _refreshTokenCommand.Delete(refreshToken);
                throw new InvalidRefreshTokenException("El Refresh Token no corresponde al usuario.");
            }

            if (refreshToken.ExpireDate < now)
            {
                await _refreshTokenCommand.Delete(refreshToken);
                throw new InvalidRefreshTokenException("El Refresh Token ha expirado.");
            }
                        
            var lastUsedAgo = now - refreshToken.LastUsed;
            if (lastUsedAgo.TotalMinutes > _idleTimeoutMinutes)
            {               
                await _refreshTokenCommand.Delete(refreshToken);
                throw new InvalidRefreshTokenException("El Refresh Token ha expirado debido a inactividad");
            }

            refreshToken.LastUsed = now;
            
            var user = await _userQuery.GetUserById(refreshToken.UserId);

            if (user == null)
            {
                throw new NotFoundException("No se encontró el usuario.");
            }

            var accessToken = await _authTokenService.GenerateAccessToken(user);
                        
            var rawRefreshToken = await _authTokenService.GenerateRefreshToken();
            var newRefreshToken = new RefreshToken
            {
                Token = _refreshTokenHasher.Hash(rawRefreshToken),
                CreateDate = now,
                ExpireDate = refreshToken.ExpireDate,
                UserId = user.UserId,
                IsActive = true,
                LastUsed = now
            };

            await _refreshTokenCommand.RotateRefreshToken(refreshToken, newRefreshToken);            

            return new LoginResponse { AccessToken = accessToken, RefreshToken = rawRefreshToken, Result = true, Message = "Tokens renovados exitosamente." };
        }

        private ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
        {
            var rawKey = _configuration["JwtSettings:key"] ?? string.Empty;
            if (string.IsNullOrWhiteSpace(rawKey))
            {
                throw new InvalidOperationException("JwtSettings:key no está configurado.");
            }

            var keyBytes = Encoding.UTF8.GetBytes(rawKey);
            if (keyBytes.Length < 32)
            {
                keyBytes = SHA256.HashData(keyBytes);
            }

            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = false,
                ClockSkew = TimeSpan.Zero
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);
            if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidRefreshTokenException("El Access Token expirado es inválido.");
            }

            return principal;
        }

        private Guid? GetUserIdFromPrincipal(ClaimsPrincipal principal)
        {
            var claimValue = principal.FindFirst(CustomClaims.UserId)?.Value
                             ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            return Guid.TryParse(claimValue, out var userId) ? userId : null;
        }
    }
}

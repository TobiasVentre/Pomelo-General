using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Application.Dtos.Request;
using Application.Exceptions;
using Application.Interfaces.ICommand;
using Application.Interfaces.IQuery;
using Application.Interfaces.IServices;
using Application.Interfaces.IServices.IAuthServices;
using Application.UseCase.AuthServices;
using Domain.Entities;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Moq;

namespace AuthMS.Tests.Application.UseCase.AuthServices;

public class RefreshTokenServiceTests
{
    private static readonly Guid UserId1 = Guid.Parse("00000000-0000-0000-0000-000000000001");
    private static readonly Guid UserId2 = Guid.Parse("00000000-0000-0000-0000-000000000002");
    private static readonly Guid UserId7 = Guid.Parse("00000000-0000-0000-0000-000000000007");

    [Fact]
    public async Task RefreshAccessToken_WhenTokenHasNoUserIdClaim_ShouldThrowInvalidRefreshTokenException()
    {
        // Arrange
        const string jwtKey = "this-is-a-test-jwt-key-with-length-over-32";

        var authTokenMock = new Mock<IAuthTokenService>();
        var refreshTokenCommandMock = new Mock<IRefreshTokenCommand>();
        var refreshTokenQueryMock = new Mock<IRefreshTokenQuery>();
        var userQueryMock = new Mock<IUserQuery>();
        var timeProviderMock = new Mock<ITimeProvider>();
        var hasherMock = new Mock<IRefreshTokenHasher>();

        var configuration = BuildConfiguration(jwtKey, idleTimeoutMinutes: "15");
        timeProviderMock.SetupGet(x => x.Now).Returns(new DateTime(2026, 2, 25, 12, 0, 0, DateTimeKind.Utc));

        var expiredAccessToken = CreateExpiredAccessToken(jwtKey, new Claim(ClaimTypes.Email, "user@test.com"));

        var service = new RefreshTokenService(
            authTokenMock.Object,
            refreshTokenCommandMock.Object,
            refreshTokenQueryMock.Object,
            userQueryMock.Object,
            configuration,
            timeProviderMock.Object,
            hasherMock.Object);

        var request = new RefreshTokenRequest
        {
            ExpiredAccessToken = expiredAccessToken,
            RefreshToken = "raw-refresh"
        };

        // Act
        Func<Task> act = () => service.RefreshAccessToken(request);

        // Assert
        await act.Should().ThrowAsync<InvalidRefreshTokenException>();
    }

    [Fact]
    public async Task RefreshAccessToken_WhenRefreshTokenBelongsToAnotherUser_ShouldDeleteAndThrowInvalidRefreshTokenException()
    {
        // Arrange
        const string jwtKey = "this-is-a-test-jwt-key-with-length-over-32";
        var now = new DateTime(2026, 2, 25, 12, 0, 0, DateTimeKind.Utc);

        var authTokenMock = new Mock<IAuthTokenService>();
        var refreshTokenCommandMock = new Mock<IRefreshTokenCommand>();
        var refreshTokenQueryMock = new Mock<IRefreshTokenQuery>();
        var userQueryMock = new Mock<IUserQuery>();
        var timeProviderMock = new Mock<ITimeProvider>();
        var hasherMock = new Mock<IRefreshTokenHasher>();

        var configuration = BuildConfiguration(jwtKey, idleTimeoutMinutes: "15");

        timeProviderMock.SetupGet(x => x.Now).Returns(now);

        var expiredAccessToken = CreateExpiredAccessToken(
            jwtKey,
            new Claim(CustomClaims.UserId, UserId1.ToString()),
            new Claim(ClaimTypes.Email, "user@test.com"));

        var storedRefreshToken = new RefreshToken
        {
            RefreshTokenId = 11,
            Token = "stored-hash",
            UserId = UserId2,
            IsActive = true,
            ExpireDate = now.AddMinutes(30),
            LastUsed = now
        };

        refreshTokenQueryMock.Setup(x => x.GetByToken("raw-refresh")).ReturnsAsync(storedRefreshToken);

        var service = new RefreshTokenService(
            authTokenMock.Object,
            refreshTokenCommandMock.Object,
            refreshTokenQueryMock.Object,
            userQueryMock.Object,
            configuration,
            timeProviderMock.Object,
            hasherMock.Object);

        var request = new RefreshTokenRequest
        {
            ExpiredAccessToken = expiredAccessToken,
            RefreshToken = "raw-refresh"
        };

        // Act
        Func<Task> act = () => service.RefreshAccessToken(request);

        // Assert
        await act.Should().ThrowAsync<InvalidRefreshTokenException>();
        refreshTokenCommandMock.Verify(x => x.Delete(storedRefreshToken), Times.Once);
    }

    [Fact]
    public async Task RefreshAccessToken_WhenRefreshTokenIsExpiredByInactivity_ShouldDeleteAndThrowInvalidRefreshTokenException()
    {
        // Arrange
        const string jwtKey = "this-is-a-test-jwt-key-with-length-over-32";
        var now = new DateTime(2026, 2, 25, 12, 0, 0, DateTimeKind.Utc);

        var authTokenMock = new Mock<IAuthTokenService>();
        var refreshTokenCommandMock = new Mock<IRefreshTokenCommand>();
        var refreshTokenQueryMock = new Mock<IRefreshTokenQuery>();
        var userQueryMock = new Mock<IUserQuery>();
        var timeProviderMock = new Mock<ITimeProvider>();
        var hasherMock = new Mock<IRefreshTokenHasher>();

        var configuration = BuildConfiguration(jwtKey, idleTimeoutMinutes: "15");

        timeProviderMock.SetupGet(x => x.Now).Returns(now);

        var expiredAccessToken = CreateExpiredAccessToken(jwtKey, new Claim(CustomClaims.UserId, UserId7.ToString()));

        var storedRefreshToken = new RefreshToken
        {
            RefreshTokenId = 55,
            Token = "stored-hash",
            UserId = UserId7,
            IsActive = true,
            ExpireDate = now.AddMinutes(60),
            LastUsed = now.AddMinutes(-20)
        };

        refreshTokenQueryMock.Setup(x => x.GetByToken("raw-refresh")).ReturnsAsync(storedRefreshToken);

        var service = new RefreshTokenService(
            authTokenMock.Object,
            refreshTokenCommandMock.Object,
            refreshTokenQueryMock.Object,
            userQueryMock.Object,
            configuration,
            timeProviderMock.Object,
            hasherMock.Object);

        var request = new RefreshTokenRequest
        {
            ExpiredAccessToken = expiredAccessToken,
            RefreshToken = "raw-refresh"
        };

        // Act
        Func<Task> act = () => service.RefreshAccessToken(request);

        // Assert
        await act.Should().ThrowAsync<InvalidRefreshTokenException>();
        refreshTokenCommandMock.Verify(x => x.Delete(storedRefreshToken), Times.Once);
    }

    [Fact]
    public async Task RefreshAccessToken_WhenRequestIsValid_ShouldRotateRefreshTokenAndReturnNewTokens()
    {
        // Arrange
        const string jwtKey = "this-is-a-test-jwt-key-with-length-over-32";
        var now = new DateTime(2026, 2, 25, 12, 0, 0, DateTimeKind.Utc);

        var authTokenMock = new Mock<IAuthTokenService>();
        var refreshTokenCommandMock = new Mock<IRefreshTokenCommand>();
        var refreshTokenQueryMock = new Mock<IRefreshTokenQuery>();
        var userQueryMock = new Mock<IUserQuery>();
        var timeProviderMock = new Mock<ITimeProvider>();
        var hasherMock = new Mock<IRefreshTokenHasher>();

        var configuration = BuildConfiguration(jwtKey, idleTimeoutMinutes: "15");

        var user = new User
        {
            UserId = UserId7,
            Email = "user@test.com",
            Password = "hash",
            IsActive = true,
            IsEmailVerified = true
        };

        var oldRefreshToken = new RefreshToken
        {
            RefreshTokenId = 77,
            Token = "old-hash",
            UserId = UserId7,
            IsActive = true,
            ExpireDate = now.AddMinutes(40),
            LastUsed = now.AddMinutes(-5)
        };

        RefreshToken? rotatedToken = null;

        timeProviderMock.SetupGet(x => x.Now).Returns(now);
        refreshTokenQueryMock.Setup(x => x.GetByToken("raw-refresh")).ReturnsAsync(oldRefreshToken);
        userQueryMock.Setup(x => x.GetUserById(UserId7)).ReturnsAsync(user);
        authTokenMock.Setup(x => x.GenerateAccessToken(user)).ReturnsAsync("new-access-token");
        authTokenMock.Setup(x => x.GenerateRefreshToken()).ReturnsAsync("new-raw-refresh-token");
        hasherMock.Setup(x => x.Hash("new-raw-refresh-token")).Returns("new-hashed-refresh-token");
        refreshTokenCommandMock
            .Setup(x => x.RotateRefreshToken(oldRefreshToken, It.IsAny<RefreshToken>()))
            .Callback<RefreshToken, RefreshToken>((_, newToken) => rotatedToken = newToken)
            .Returns(Task.CompletedTask);

        var expiredAccessToken = CreateExpiredAccessToken(jwtKey, new Claim(CustomClaims.UserId, UserId7.ToString()));

        var service = new RefreshTokenService(
            authTokenMock.Object,
            refreshTokenCommandMock.Object,
            refreshTokenQueryMock.Object,
            userQueryMock.Object,
            configuration,
            timeProviderMock.Object,
            hasherMock.Object);

        var request = new RefreshTokenRequest
        {
            ExpiredAccessToken = expiredAccessToken,
            RefreshToken = "raw-refresh"
        };

        // Act
        var result = await service.RefreshAccessToken(request);

        // Assert
        result.Result.Should().BeTrue();
        result.AccessToken.Should().Be("new-access-token");
        result.RefreshToken.Should().Be("new-raw-refresh-token");

        rotatedToken.Should().NotBeNull();
        rotatedToken!.Token.Should().Be("new-hashed-refresh-token");
        rotatedToken.UserId.Should().Be(UserId7);
        rotatedToken.CreateDate.Should().Be(now);
        rotatedToken.LastUsed.Should().Be(now);
        rotatedToken.ExpireDate.Should().Be(oldRefreshToken.ExpireDate);

        refreshTokenCommandMock.Verify(x => x.RotateRefreshToken(oldRefreshToken, It.IsAny<RefreshToken>()), Times.Once);
        refreshTokenCommandMock.Verify(x => x.Delete(It.IsAny<RefreshToken>()), Times.Never);
    }

    private static IConfiguration BuildConfiguration(string jwtKey, string idleTimeoutMinutes)
    {
        var values = new Dictionary<string, string?>
        {
            ["JwtSettings:key"] = jwtKey,
            ["RefreshTokenSettings:IdleTimeoutMinutes"] = idleTimeoutMinutes
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(values)
            .Build();
    }

    private static string CreateExpiredAccessToken(string jwtKey, params Claim[] claims)
    {
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            SecurityAlgorithms.HmacSha256);

        var jwt = new JwtSecurityToken(
            issuer: null,
            audience: null,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(-10),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(jwt);
    }
}

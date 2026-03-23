using Application.Interfaces.IServices.ICryptographyService;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AuthMS.Api.Bootstrap;

internal sealed class BootstrapAdminOptions
{
    public bool Enabled { get; set; }
    public string? Email { get; set; }
    public string? Password { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Dni { get; set; }
}

internal static class BootstrapAdminService
{
    public static async Task EnsureBootstrapAdminAsync(
        IServiceProvider services,
        IConfiguration configuration,
        ILogger logger)
    {
        var options = configuration.GetSection("BootstrapAdmin").Get<BootstrapAdminOptions>();
        if (options is null || !options.Enabled)
        {
            logger.LogInformation("Bootstrap admin disabled.");
            return;
        }

        var missingFields = new List<string>();

        if (string.IsNullOrWhiteSpace(options.Email))
        {
            missingFields.Add("BootstrapAdmin:Email");
        }

        if (string.IsNullOrWhiteSpace(options.Password))
        {
            missingFields.Add("BootstrapAdmin:Password");
        }

        if (string.IsNullOrWhiteSpace(options.FirstName))
        {
            missingFields.Add("BootstrapAdmin:FirstName");
        }

        if (string.IsNullOrWhiteSpace(options.LastName))
        {
            missingFields.Add("BootstrapAdmin:LastName");
        }

        if (string.IsNullOrWhiteSpace(options.Dni))
        {
            missingFields.Add("BootstrapAdmin:Dni");
        }

        if (missingFields.Count > 0)
        {
            logger.LogWarning(
                "Bootstrap admin enabled but missing required fields: {Fields}",
                string.Join(", ", missingFields));
            return;
        }

        var dbContext = services.GetRequiredService<AppDbContext>();
        var cryptographyService = services.GetRequiredService<ICryptographyService>();
        var normalizedEmail = options.Email!.Trim();

        var existingUser = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(user => user.Email == normalizedEmail);

        if (existingUser is not null)
        {
            logger.LogInformation(
                "Bootstrap admin skipped because user {Email} already exists.",
                normalizedEmail);
            return;
        }

        var hashedPassword = await cryptographyService.HashPassword(options.Password!);

        dbContext.Users.Add(new User
        {
            UserId = Guid.NewGuid(),
            Role = UserRoles.Admin,
            IsActive = true,
            FirstName = options.FirstName!.Trim(),
            LastName = options.LastName!.Trim(),
            Email = normalizedEmail,
            Dni = options.Dni!.Trim(),
            Password = hashedPassword,
            Specialty = null,
            IsEmailVerified = true,
            AccessFailedCount = 0,
            LockoutEndDate = null
        });

        await dbContext.SaveChangesAsync();

        logger.LogInformation(
            "Bootstrap admin created successfully for {Email}.",
            normalizedEmail);
    }
}

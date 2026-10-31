# Keep cinema accounts in ASP.NET Core Identity

Customer and administrator accounts use ASP.NET Core Identity in the existing PostgreSQL database, with browser cookies and CSRF protection. This follows the project's .NET learning roadmap and keeps account lifecycle, permissions, and booking ownership within the current application; external sign-in providers are deferred. Guest checkout remains available, and historical guest bookings are not assigned to accounts by matching email addresses.

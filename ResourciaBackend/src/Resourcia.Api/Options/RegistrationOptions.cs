namespace Resourcia.Api.Options;

public enum RegistrationMode
{
    FullRelease = 0,
    ClosedBeta = 1
}

public class RegistrationOptions
{
    public RegistrationMode Mode { get; set; } = RegistrationMode.FullRelease;

    public bool RequiresInvite => Mode == RegistrationMode.ClosedBeta;
}

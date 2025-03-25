namespace Resourcia.Api.Services.Interfaces
{
    public interface IDeweyService
    {
        Task<bool> IsValidDewey(int standardDewey); 
        Task<ushort> ConvertToStandardDewey(int encodedDewey); // Should I return digits as well?
        Task<ushort> ConvertFromStandardDewey(int standardDewey, int digits);
    }
}

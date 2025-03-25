using Resourcia.Api.Services.Interfaces;

namespace Resourcia.Api.Services;

public class DeweyService : IDeweyService
{
    public async Task<ushort> ConvertToStandardDewey(int encodedDewey)
    {
        throw new NotImplementedException();

    }
    public async Task<ushort> ConvertFromStandardDewey(int standardDewey, int digits)
    {
        if (!await IsValidDewey(standardDewey))
        {
            throw new ArgumentException("Invalid Dewey number");
        }
        else
        {
            return (ushort) ((digits-1)*Math.Pow(2,14)+standardDewey); // 2^12 allows us to manipulate the first 2 bits of the 16-bit number.
        }
    }
    public async Task<bool> IsValidDewey(int standardDewey)
    {
        return standardDewey >= 0 && standardDewey <= 9999;
    }
}

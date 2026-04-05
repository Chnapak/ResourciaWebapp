using Resourcia.Api.Utils;
using Xunit;

namespace Resourcia.Api.UnitTests;

public class ProfileHandleUtilityTests
{
    [Theory]
    [InlineData(" John Doe ", "johndoe")]
    [InlineData("Jane.Doe", "jane.doe")]
    [InlineData("User_name-123", "user_name-123")]
    [InlineData("M@teJ!", "mtej")]
    public void BuildHandle_NormalizesValue(string input, string expected)
    {
        var handle = ProfileHandleUtility.BuildHandle(input);

        Assert.Equal(expected, handle);
    }
}

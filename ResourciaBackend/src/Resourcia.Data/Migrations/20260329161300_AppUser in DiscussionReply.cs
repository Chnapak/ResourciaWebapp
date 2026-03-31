using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Resourcia.Data.Migrations
{
    /// <inheritdoc />
    public partial class AppUserinDiscussionReply : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_DiscussionReplies_UserId",
                table: "DiscussionReplies",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_DiscussionReplies_AspNetUsers_UserId",
                table: "DiscussionReplies",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DiscussionReplies_AspNetUsers_UserId",
                table: "DiscussionReplies");

            migrationBuilder.DropIndex(
                name: "IX_DiscussionReplies_UserId",
                table: "DiscussionReplies");
        }
    }
}

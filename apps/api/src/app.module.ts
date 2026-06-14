import { Module } from "@nestjs/common";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { BlueprintModule } from "./blueprint/blueprint.module";
import { CommentsModule } from "./comments/comments.module";
import { CyclesModule } from "./cycles/cycles.module";
import { InboxModule } from "./inbox/inbox.module";
import { auth } from "./lib/auth";
import { NotificationsModule } from "./notifications/notifications.module";
import { ProjectsModule } from "./projects/projects.module";
import { UsersModule } from "./users/users.module";
import { WorkspacesModule } from "./workspaces/workspaces.module";
import { ChatModule } from "./chat/chat.module";

@Module({
  imports: [
    WorkspacesModule,
    AuthModule.forRoot({
      auth,
    }),
    ProjectsModule,
    BlueprintModule,
    UsersModule,
    CyclesModule,
    ChatModule,
    NotificationsModule,
    InboxModule,
    CommentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

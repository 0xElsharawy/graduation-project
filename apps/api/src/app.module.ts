import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { LoggerModule } from "nestjs-pino";
import { TerminusModule } from "@nestjs/terminus";
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
import { MetricsController } from "./metrics/metrics.controller";
import { ChatModule } from "./chat/chat.module";

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? "info",
        transport:
          process.env.NODE_ENV !== "production"
            ? { target: "pino-pretty" }
            : undefined,
        redact: ["req.headers.authorization", "req.headers.cookie"],
      },
    }),
    TerminusModule,
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
  controllers: [AppController, MetricsController],
  providers: [AppService],
})
export class AppModule {}

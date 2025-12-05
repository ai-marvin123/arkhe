import * as vscode from "vscode";
import { MockService } from "../services/MockService";
import { WrapperType } from "../schemas/WrapperSchema";

export class CommandHandler {
  /**
   * Now handle() expects JUST the webview panel and the message.
   */
  static async handle(
    panel: vscode.WebviewPanel,
    message: { command: string; prompt?: string }
  ) {
    const { command, prompt } = message;

    let response: any;

    switch (command) {
      case "generateDiagram":
        response = MockService.getMockResponse(prompt ?? "");
        break;

      case "getMockDiagram":
        response = MockService.getDiagramMock();
        break;

      case "getMockChat":
        response = MockService.getChatMock();
        break;

      case "getEdgeCases":
        response = MockService.getEdgeCases();
        break;

      default:
        response = {
          type: "TEXT",
          message: `Unknown command: ${command}`,
        };
    }

    panel.webview.postMessage(response);
  }
}

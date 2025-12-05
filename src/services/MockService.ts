import { simpleDiagramMock } from "../mocks/diagramMocks";
import { simpleChatMock } from "../mocks/chatMocks";
import {
  missingNodeTypeMock,
  emptyStructureMock,
} from "../mocks/edgeCaseMocks";
import { AiResponsePayload } from "../types";

export class MockService {
  static getDiagramMock(): AiResponsePayload {
    return simpleDiagramMock;
  }

  static getChatMock(): AiResponsePayload {
    return simpleChatMock;
  }

  static getEdgeCases() {
    return {
      missingNodeType: missingNodeTypeMock,
      emptyStructure: emptyStructureMock,
    };
  }

  /**
   * Returns a mock response based on keyword detection
   * to simulate Phase 3 behavior.
   */
  static getMockResponse(prompt: string): AiResponsePayload {
    const lower = prompt.toLowerCase();

    // Edge-case failure mocks
    if (lower.includes("error")) return missingNodeTypeMock;
    if (lower.includes("empty")) return emptyStructureMock;

    // Framework/system diagram mocks
    if (lower.includes("nestjs")) return simpleDiagramMock;
    if (lower.includes("folder") || lower.includes("structure"))
      return simpleDiagramMock;

    // Natural chat mode, explanation requests
    if (lower.includes("chat") || lower.includes("message"))
      return simpleChatMock;

    // Default fallback (chat feels better UX)
    return simpleChatMock;
  }
}

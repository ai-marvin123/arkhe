import { simpleDiagramMock } from "../mocks/diagramMocks";
import { simpleChatMock } from "../mocks/chatMocks";
import {
  missingNodeTypeMock,
  emptyStructureMock,
} from "../mocks/edgeCaseMocks";

export class MockService {
  static getDiagramMock() {
    return simpleDiagramMock;
  }

  static getChatMock() {
    return simpleChatMock;
  }

  static getEdgeCases() {
    return {
      missingNodeType: missingNodeTypeMock,
      emptyStructure: emptyStructureMock,
    };
  }

  /**
   * Returns a mock response based on keyword detection in the prompt.
   */
  static getMockResponse(prompt: string) {
    const lower = prompt.toLowerCase();

    // Edge-case mocks
if (lower.includes("error")) return missingNodeTypeMock;
if (lower.includes("empty")) return emptyStructureMock;

// Framework-specific mocks
if (lower.includes("nestjs")) return simpleDiagramMock;
if (lower.includes("folder") || lower.includes("structure"))
  return simpleDiagramMock;

// Chat mocks
if (lower.includes("chat") || lower.includes("message"))
  return simpleChatMock;

// Default fallback
return simpleDiagramMock;

  }
}

import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";

import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { SerpAPI } from "@langchain/community/tools/serpapi";
import { Calculator } from "@langchain/community/tools/calculator";
import {
  AIMessage,
  BaseMessage,
  ChatMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

import { convertMarkdownToJson } from '../../convert/md2json/md2json.service';
import { reduceJsonToContext } from "../../decompose/reducer/json2context.service";
import { persistContexts } from "../persistContext.service";
import { reduceJsonToAtoms } from "../../decompose/reducer/json2atoms.service";
import { persistAtoms } from "../persistAtom.service";
import { convertPoliticianToMarkdown } from "../../custom/politician2md.service";

export const runtime = "edge";

const convertVercelMessageToLangChainMessage = (message: VercelChatMessage) => {
  if (message.role === "user") {
    return new HumanMessage(message.content);
  } else if (message.role === "assistant") {
    return new AIMessage(message.content);
  } else {
    return new ChatMessage(message.content, message.role);
  }
};

const convertLangChainMessageToVercelMessage = (message: BaseMessage) => {
  if (message._getType() === "human") {
    return { content: message.content, role: "user" };
  } else if (message._getType() === "ai") {
    return {
      content: message.content,
      role: "assistant",
      tool_calls: (message as AIMessage).tool_calls,
    };
  } else {
    return { content: message.content, role: message._getType() };
  }
};

const AGENT_SYSTEM_TEMPLATE = `You are a talking parrot named Polly. All final responses must be how a talking parrot would respond. Squawk often!`;

/**
 * This handler initializes and calls an tool caling ReAct agent.
 * See the docs for more information:
 *
 * https://langchain-ai.github.io/langgraphjs/tutorials/quickstart/
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const returnIntermediateSteps = body.show_intermediate_steps;
    /**
     * We represent intermediate steps as system messages for display purposes,
     * but don't want them in the chat history.
     */
    // const messages = (body.messages ?? [])
    //   .filter(
    //     (message: VercelChatMessage) =>
    //       message.role === "user" || message.role === "assistant",
    //   )
    //   .map(convertVercelMessageToLangChainMessage);

    const messages = (body.messages ?? [])

    const lastMessage = messages[messages.length-1].content
    const mdNote = convertPoliticianToMarkdown(JSON.parse(lastMessage))
    const jsonNote = convertMarkdownToJson(mdNote)
    const contexts = reduceJsonToContext(jsonNote)
    const atoms = reduceJsonToAtoms(jsonNote)

    await persistContexts(contexts)
    await persistAtoms(atoms)

    return NextResponse.json(
    {
        messages: [{"content": JSON.stringify(jsonNote, null, 2)}] // result.messages.map(convertLangChainMessageToVercelMessage),
    },
    { status: 200 },
    );
    // }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

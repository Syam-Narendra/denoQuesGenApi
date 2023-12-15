// deno-lint-ignore-file no-explicit-any
import { Handlers } from "https://deno.land/x/fresh@1.6.1/server.ts";
import { load } from "https://deno.land/std@0.209.0/dotenv/mod.ts";
import OpenAI from "npm:openai";

enum Level {
  basic,
  medium,
  high,
  advanced,
}

const levelMap: Record<number, Level> = {
  1: Level.basic,
  2: Level.medium,
  3: Level.high,
  4: Level.advanced,
};

const env = await load();

const resource = Deno.env.get("resource");
const deployment = Deno.env.get("deployment");
const apiVersion = Deno.env.get("apiVersion");
const apiKey = env["apiKey"];

export const handler: Handlers = {
  async POST(req, _ctx) {
    const { level, skill } = await req.json();
    try {
      const openai = new OpenAI({
        apiKey: apiKey,
        baseURL:
          `https://${resource}.openai.azure.com/openai/deployments/${deployment}`,
        defaultQuery: { "api-version": apiVersion },
        defaultHeaders: { "api-key": apiKey },
      });
      const userLevel = levelMap[level];
      if (!userLevel) {
        throw new Error("unexpected user level found");
      }
      const userPrompt =
        `generate ten ${userLevel} level questions on ${skill} and four options and give right answer in a json object as {question:"question",options:[a,b,c,d],answer:"answer"}`;
      const response = await openai.chat.completions.create({
        messages: [{ role: "system", content: userPrompt }],
        model: "gpt-3.5-turbo",
      });
      const questions: any = await response.choices[0].message.content;
      return new Response(questions);
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error.response ? error.response.data : error.message,
        }),
      );
    }
  },
};

import { NextRequest, NextResponse } from "next/server";

type Verdict =
  | "Greenlight"
  | "Workbench"
  | "Distraction"
  | "Beautiful Mess"
  | "Dangerously Good";

type IdeanatorRequest = {
  ideaName?: string;
  ideaText?: string;
  ideaKind?: string;
  primaryNeed?: string;
};

type IdeanatorResponse = {
  ideaName: string;
  ideaKind: string;
  primaryNeed: string;
  verdict: Verdict;
  spark: string;
  plainEnglishVersion: string;
  strongestUseCase: string;
  weakSpots: string;
  audience: string;
  moneyValuePath: string;
  avoidance: string;
  nextThreeMoves: string[];
};

const VALID_VERDICTS: Verdict[] = [
  "Greenlight",
  "Workbench",
  "Distraction",
  "Beautiful Mess",
  "Dangerously Good",
];

function cleanText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ");
}

function normalizeIdeaName(value: unknown) {
  const cleaned = cleanText(value);

  if (!cleaned) {
    return "Untitled Little Bastard";
  }

  const hasRealCharacters = /[a-zA-Z0-9]/.test(cleaned);

  if (!hasRealCharacters) {
    return "Untitled Little Bastard";
  }

  return cleaned;
}

function normalizeIdeaKind(value: unknown) {
  const cleaned = cleanText(value);

  if (!cleaned) {
    return "I have no damn clue";
  }

  return cleaned;
}

function normalizePrimaryNeed(value: unknown) {
  const cleaned = cleanText(value);

  if (!cleaned) {
    return "Is this worth pursuing?";
  }

  return cleaned;
}

function getIdeaPhrase(kind: string) {
  if (kind === "I have no damn clue") {
    return "early-stage idea";
  }

  return `${kind.toLowerCase()} concept`;
}

function chooseMockVerdict(kind: string, need: string, ideaText: string): Verdict {
  const text = ideaText.toLowerCase();

  if (kind === "Book / Story") {
    return "Beautiful Mess";
  }

  if (kind === "Invention / Product") {
    return "Dangerously Good";
  }

  if (kind === "Social Impact") {
    return "Workbench";
  }

  if (need === "Tear it apart honestly") {
    return "Workbench";
  }

  if (
    text.includes("subscription") ||
    text.includes("school") ||
    text.includes("safety") ||
    text.includes("tool") ||
    text.includes("app")
  ) {
    return "Workbench";
  }

  return "Workbench";
}

function buildMockReport({
  ideaName,
  ideaText,
  ideaKind,
  primaryNeed,
}: {
  ideaName: string;
  ideaText: string;
  ideaKind: string;
  primaryNeed: string;
}): IdeanatorResponse {
  const verdict = chooseMockVerdict(ideaKind, primaryNeed, ideaText);
  const phrase = getIdeaPhrase(ideaKind);

  return {
    ideaName,
    ideaKind,
    primaryNeed,
    verdict,
    spark:
      "There is something here because the idea has tension. It is trying to move from loose chaos into a usable shape, and that is usually where the good stuff starts making noise.",
    plainEnglishVersion: `${ideaName} is a ${phrase} that needs to be reduced to one clean promise before anyone can judge whether it has legs.`,
    strongestUseCase:
      "The strongest version helps a real person take a next step. The value is not more inspiration. The value is clarity, direction, and enough honesty to stop wasting time on the wrong version.",
    weakSpots:
      "Right now, the danger is over-explaining. If this takes five paragraphs to defend, the user will leave. The first version needs one job, one promise, and one satisfying result.",
    audience:
      "This is probably for idea-heavy people: writers, founders, inventors, students, small business owners, creators, and restless porch philosophers with too many napkins and not enough structure.",
    moneyValuePath:
      "The path is not selling inspiration. The path is selling clarity. That could become a paid idea check, saved reports, deeper diagnostics, specialized tracks, or a lightweight pre-pitch tool.",
    avoidance:
      "You may be attached to the clever version of the idea instead of the useful version. The useful version is usually smaller, uglier, and more likely to survive contact with real people.",
    nextThreeMoves: [
      "Write the one-sentence version.",
      "Show it to five people who might actually use it.",
      "Build the smallest ugly version possible before adding any fancy bullshit.",
    ],
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      "The Ideanator API route is alive. POST an idea here when you are ready to put the little bastard on the lift.",
    validVerdicts: VALID_VERDICTS,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as IdeanatorRequest;

    const ideaName = normalizeIdeaName(body.ideaName);
    const ideaText = cleanText(body.ideaText);
    const ideaKind = normalizeIdeaKind(body.ideaKind);
    const primaryNeed = normalizePrimaryNeed(body.primaryNeed);

    if (!ideaText) {
      return NextResponse.json(
        {
          ok: false,
          error: "Idea text is required.",
        },
        { status: 400 },
      );
    }

    const report = buildMockReport({
      ideaName,
      ideaText,
      ideaKind,
      primaryNeed,
    });

    return NextResponse.json({
      ok: true,
      report,
    });
  } catch (error) {
    console.error("Ideanator API error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "The Ideanator coughed, smoked, and refused to start.",
      },
      { status: 500 },
    );
  }
}
export const EMBEDDING_DIMS = 384;

type Extractor = (input: string, options: { pooling: "mean"; normalize: true }) => Promise<{ data: Float32Array | number[] }>;

let extractor: Extractor | null = null;
let warnedUnavailable = false;

async function getExtractor(): Promise<Extractor | null> {
  if (extractor) return extractor;

  try {
    const { pipeline } = await import("@huggingface/transformers");
    const loaded = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    extractor = loaded as unknown as Extractor;
    return extractor;
  } catch {
    if (!warnedUnavailable) {
      warnedUnavailable = true;
      // Keep production routes usable when native runtime deps are unavailable.
      console.warn("Embedding model unavailable; falling back to zero vectors.");
    }
    return null;
  }
}

export async function embedText(text: string): Promise<number[]> {
  const normalized = text.replace(/\s+/g, " ").trim().slice(0, 8000);
  if (!normalized) return Array(EMBEDDING_DIMS).fill(0);

  const activeExtractor = await getExtractor();
  if (!activeExtractor) return Array(EMBEDDING_DIMS).fill(0);

  const output = await activeExtractor(normalized, { pooling: "mean", normalize: true });

  const embedding = Array.from(output.data as Float32Array);
  if (embedding.length !== EMBEDDING_DIMS) {
    throw new Error(`Expected ${EMBEDDING_DIMS} embedding dimensions, received ${embedding.length}.`);
  }
  return embedding;
}

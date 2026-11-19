import { pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";

export const EMBEDDING_DIMS = 384;

let extractor: FeatureExtractionPipeline | null = null;

export async function embedText(text: string): Promise<number[]> {
  const normalized = text.replace(/\s+/g, " ").trim().slice(0, 8000);
  if (!normalized) return Array(EMBEDDING_DIMS).fill(0);

  extractor ??= await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  const output = await extractor(normalized, { pooling: "mean", normalize: true });

  const embedding = Array.from(output.data as Float32Array);
  if (embedding.length !== EMBEDDING_DIMS) {
    throw new Error(`Expected ${EMBEDDING_DIMS} embedding dimensions, received ${embedding.length}.`);
  }
  return embedding;
}

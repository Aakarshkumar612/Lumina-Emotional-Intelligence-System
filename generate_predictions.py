import pandas as pd
import numpy as np
from app.pipeline.predict_engine import get_engine

TEST_PATH  = "data/test.csv"
OUTPUT_PATH = "predictions.csv"


def main():
    print("Loading test data...")
    test_df = pd.read_csv(TEST_PATH)
    print(f"  Test shape: {test_df.shape}")

    print("Loading prediction engine...")
    engine = get_engine()

    print("Running predictions...")
    records = test_df.to_dict(orient="records")
    results = engine.predict_batch(records)

    print("Building predictions.csv...")
    rows = []
    for r in results:
        rows.append({
            "id":                  r.get("id"),
            "predicted_state":     r.get("predicted_state"),
            "predicted_intensity": r.get("predicted_intensity"),
            "confidence":          r.get("confidence"),
            "uncertain_flag":      r.get("uncertain_flag"),
            "what_to_do":          r.get("what_to_do"),
            "when_to_do":          r.get("when_to_do"),
            "supportive_message":  r.get("supportive_message"),
        })

    out_df = pd.DataFrame(rows)
    out_df.to_csv(OUTPUT_PATH, index=False)

    print(f"\n✅ Saved → {OUTPUT_PATH}")
    print(f"   Total predictions: {len(out_df)}")
    print(f"\n=== Preview ===")
    print(out_df.head(10).to_string())
    print(f"\n=== State Distribution ===")
    print(out_df['predicted_state'].value_counts())
    print(f"\n=== Intensity Distribution ===")
    print(out_df['predicted_intensity'].value_counts().sort_index())
    print(f"\n=== Uncertain Flags ===")
    uncertain_count = out_df['uncertain_flag'].sum()
    print(f"  Uncertain: {uncertain_count}/{len(out_df)} ({100*uncertain_count/len(out_df):.1f}%)")


if __name__ == "__main__":
    main()
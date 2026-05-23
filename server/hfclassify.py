import time
from transformers import pipeline

print("⏳ Loading advanced language model...")
print("⚠️  Note: The very first run will automatically download a ~1.6GB model.")
print("   Subsequent runs will load instantly from your local cache.\n")

start_time = time.time()
# Initialize the pipeline with the robust bart-large-mnli model
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
print(f"✅ Model loaded successfully in {time.time() - start_time:.2f} seconds.")

# 🏛️ Define your target government departments
GOVERNMENT_DEPARTMENTS = [
    "Electricity & Power", 
    "Sanitation & Waste Management", 
    "Water Supply & Sewage", 
    "Public Works Department (PWD)", 
    "Traffic & Transportation", 
    "Revenue & Land Records", 
    "Law, Order & Public Safety", 
    "Parks, Forestry & Environment"
]

# 🧪 Complex test cases including the ones that failed the local model
test_cases = [
    "A woman is being assaulted in the university",
    "The street lamps on Sector 4 main avenue are blinking non-stop and clicking.",
    "The concrete highway has split open creating huge dangerous pits for vehicles.",
    "Cars are parked double on the highway causing an immense bottleneck jam.",
    "The old mahogany tree fell over onto the power lines and cracked the pavement."
]

print("\n🧠 HUGGING FACE ZERO-SHOT CLASSIFIER TEST RESULTS 🧠")
print("=" * 80)

for text in test_cases:
    # Let the transformer compute probabilities for each label dynamically
    result = classifier(text, candidate_labels=GOVERNMENT_DEPARTMENTS)
    
    # Hugging Face automatically sorts labels from highest probability to lowest
    best_match = result['labels'][0]
    confidence = result['scores'][0] * 100
    
    print(f"📝 Citizen Input : \"{text}\"")
    print(f"🚀 Routed To    : \033[92m{best_match}\033[0m ({confidence:.1f}% confidence)")
    print("-" * 80)
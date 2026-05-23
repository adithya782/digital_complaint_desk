import pickle

def run_comprehensive_test():
    try:
        with open('complaint_classifier.pkl', 'rb') as model_file:
            model = pickle.load(model_file)
            
        print("\n🏛️  GOVERNMENT ROUTING ENGINE: SYSTEM EVALUATION TEST 🏛️")
        print("=" * 80)
        
        # Highly distinct test sentences evaluating context boundaries
        test_cases = [
            "The street lamps on Sector 4 main avenue are blinking non-stop and clicking.",
            "Decomposing food and trash heaps are causing a horrific odor behind the apartments.",
            "Water supply has completely halted since yesterday morning and tanks are empty.",
            "The concrete highway has split open creating huge dangerous pits for vehicles.",
            "Cars are parked double on the highway causing an immense bottleneck jam.",
            "My land document registration has been stuck for months waiting for clearance.",
            "Some gang is creating trouble near the local grocery store at midnight.",
            "The old mahogany tree fell over onto the power lines and cracked the pavement.",
            "A woman is being assaulted in the university"
        ]
        
        for text in test_cases:
            prediction = model.predict([text])
            assigned_dept = prediction[0]
            
            print(f"📝 Citizen Input : \"{text}\"")
            print(f"🚀 Routed To    : \033[92m{assigned_dept}\033[0m") # Prints in bold green
            print("-" * 80)
            
    except FileNotFoundError:
        print("❌ Error: 'complaint_classifier.pkl' not found. Run the training script first!")

if __name__ == "__main__":
    run_comprehensive_test()
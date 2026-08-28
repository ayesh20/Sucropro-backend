import pandas as pd
import numpy as np
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
import joblib

# Load environment variables from the backend directory
backend_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend', '.env')
load_dotenv(backend_env_path)

print("Connecting to MongoDB to fetch training data...")

# Connect to MongoDB
client = MongoClient(os.getenv("MONGO_URI"))
db = client["test"] 
collection = db.storagetrainingdatas

# Fetch data
cursor = collection.find({}, {'_id': 0, 'createdAt': 0, '__v': 0})
data = list(cursor)

if not data:
    print("Error: No training data found in the database. Please seed the database first.")
    exit(1)

df = pd.DataFrame(data)
print(f"Fetched {len(df)} records from MongoDB.")

# Features and target
FEATURES = ['durationDays', 'avgTemp', 'avgHumidity', 'brix', 'pol', 'purity']
TARGET = 'actualRendement'

# Ensure columns exist
for col in FEATURES + [TARGET]:
    if col not in df.columns:
        print(f"Error: Column '{col}' is missing from the data.")
        exit(1)

X = df[FEATURES]
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print("Training Random Forest model...")
# Train model
rf_model = RandomForestRegressor(
    n_estimators=200,
    max_depth=None,
    min_samples_split=2,
    random_state=42,
    n_jobs=-1
)
rf_model.fit(X_train_scaled, y_train)

# Evaluate model
y_pred = rf_model.predict(X_test_scaled)
r2 = r2_score(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))

print("=" * 45)
print("  RANDOM FOREST — MODEL PERFORMANCE")
print("=" * 45)
print(f"  R² Score        : {r2:.4f}")
print(f"  MAE             : {mae:.4f}")
print(f"  RMSE            : {rmse:.4f}")
print("=" * 45)

if r2 >= 0.90:
    print("Excellent model performance!")
elif r2 >= 0.80:
    print("Good model performance")
else:
    print("Model needs improvement")

# Save model and scaler
joblib.dump(rf_model, 'model.pkl')
joblib.dump(scaler, 'scaler.pkl')

print("Model trained and saved as 'model.pkl' & 'scaler.pkl'!")

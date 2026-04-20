import torch
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score
from pathlib import Path

from model import get_resnet50_binary_model
from dataset_loader import XRayBinaryDataset, DataLoader, val_test_transform

# CONFIG
BASE_PATH = Path(r"C:\Users\ASUS TUF\Desktop\XRAY-ML-classification-system")
DATA_DIR = BASE_PATH / "ml" / "binary" / "processed"
RAW_IMAGES_BASE = BASE_PATH / "data" / "raw"
BEST_MODEL_PATH = BASE_PATH / 'ml' / 'binary' / 'best_resnet50_model.pth'
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def evaluate_best_model():
    # Load the Model Architecture
    model = get_resnet50_binary_model().to(DEVICE)

    # Load the Best Saved Weights
    model.load_state_dict(torch.load(BEST_MODEL_PATH))
    model.eval()
    print(f"Loaded best weights from: {BEST_MODEL_PATH}")

    # Setup Data
    val_ds = XRayBinaryDataset(DATA_DIR / "val.csv", RAW_IMAGES_BASE, val_test_transform)
    val_loader = DataLoader(val_ds, batch_size=16, shuffle=False)

    all_labels = []
    all_preds = []

    print("Evaluating...")
    with torch.no_grad():
        for images, labels in val_loader:
            images = images.to(DEVICE)
            outputs = model(images)

            probs = torch.sigmoid(outputs)
            preds = (probs > 0.5).float()

            all_labels.extend(labels.numpy())
            all_preds.extend(preds.cpu().numpy())

    # Classification Report
    report = classification_report(all_labels, all_preds, target_names=['Normal (0)', 'Disease (1)'])
    print("\nClassification Report:")
    print(report)

    # Confusion Matrix
    cm = confusion_matrix(all_labels, all_preds)

    # Plotting the Confusion Matrix
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=['Pred Normal', 'Pred Disease'],
                yticklabels=['Actual Normal', 'Actual Disease'])
    plt.title('Confusion Matrix: Best ResNet50 Model')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.savefig(BASE_PATH / 'ml' / 'binary' / 'final_confusion_matrix.png')
    plt.show()


if __name__ == "__main__":
    evaluate_best_model()
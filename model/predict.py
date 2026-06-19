"""
=============================================================
PREDIKTOR SENTIMEN - IndoBERT
Preprocessing di file ini HARUS identik dengan preprocessing
yang dipakai saat training (lihat notebook PKKMB_IndoBERT_FINAL),
supaya prediksi di server tidak melenceng dari hasil training.
=============================================================
"""
import re
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# Urutan label HARUS sama dengan label_map saat training:
# {'negatif': 0, 'netral': 1, 'positif': 2}
LABELS = ['negatif', 'netral', 'positif']

# Kamus normalisasi slang/singkatan - disalin dari notebook training
KAMUS_NORMALISASI = {
    'yg': 'yang', 'dgn': 'dengan', 'utk': 'untuk', 'krn': 'karena',
    'tdk': 'tidak', 'sdh': 'sudah', 'blm': 'belum', 'jg': 'juga',
    'hrs': 'harus', 'mhs': 'mahasiswa', 'bgt': 'banget',
    'gak': 'tidak', 'ga': 'tidak', 'ngga': 'tidak', 'nggak': 'tidak',
    'aja': 'saja', 'udah': 'sudah', 'udh': 'sudah', 'emang': 'memang',
    'kayak': 'seperti', 'kyk': 'seperti', 'gimana': 'bagaimana',
    'gmn': 'bagaimana', 'lbh': 'lebih', 'skrg': 'sekarang',
    'tp': 'tapi', 'kl': 'kalau', 'klo': 'kalau', 'kalo': 'kalau',
    'sm': 'sama', 'tmn': 'teman', 'sbg': 'sebagai', 'trs': 'terus',
    'ntar': 'nanti', 'sy': 'saya', 'gw': 'saya', 'gue': 'saya',
    'lu': 'kamu', 'lo': 'kamu', 'mks': 'terima kasih',
    'makasih': 'terima kasih', 'mantap': 'bagus', 'mantul': 'bagus',
    'keren': 'bagus', 'jelek': 'buruk', 'parah': 'buruk',
    'lemot': 'lambat', 'lelet': 'lambat', 'ngelag': 'lambat',
}


def clean_text(text):
    """Sama persis dengan clean_text() di notebook training."""
    if text is None or str(text).strip() == '':
        return ''
    text = str(text).lower()
    text = re.sub(r'http\S+|www\.\S+', '', text)
    text = re.sub(r'@\w+|#\w+', '', text)
    text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
    text = re.sub(r'\b\d+\b', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def normalize_text(text):
    """Sama persis dengan normalize_text() di notebook training."""
    words = text.split()
    return ' '.join(KAMUS_NORMALISASI.get(w, w) for w in words)


class SentimenPredictor:
    def __init__(self, model_dir):
        self.tokenizer = AutoTokenizer.from_pretrained(model_dir)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_dir)
        self.model.eval()
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)

    def _preprocess(self, text):
        return normalize_text(clean_text(text))

    def predict(self, teks):
        teks_bersih = self._preprocess(teks)

        inputs = self.tokenizer(
            teks_bersih,
            return_tensors='pt',
            truncation=True,
            padding='max_length',
            max_length=128,
        ).to(self.device)

        with torch.no_grad():
            outputs = self.model(**inputs)
            probs = torch.softmax(outputs.logits, dim=-1)[0].cpu().numpy()

        label_idx = int(probs.argmax())
        return {
            'teks_asli': teks,
            'teks_bersih': teks_bersih,
            'label': LABELS[label_idx],
            'confidence': float(probs[label_idx]),
            'probabilitas': {
                'negatif': float(probs[0]),
                'netral': float(probs[1]),
                'positif': float(probs[2]),
            }
        }

    def predict_batch(self, texts):
        return [self.predict(t) for t in texts]

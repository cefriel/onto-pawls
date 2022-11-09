import os
from pathlib import Path
import json

import click
import glob

from app.pawls.preprocessors.pdfplumber import process_pdfplumber

def preprocess(preprocessor: str, p: str):
    """
    Run a pre-processor on a pdf/directory of pawls pdfs and
    write the resulting token information to the pdf location.

    Current preprocessor options are: "grobid".

    To send all pawls structured pdfs in the current directory for processing:

        `pawls preprocess grobid ./`
    """
    path = Path(p)
    sha = path.name.strip(".pdf")
    #pbar.set_description(f"Processing {sha[:10]}...")
    if preprocessor == "pdfplumber":
            data = process_pdfplumber(str(path))
    with open(path.parent / "pdf_structure.json", "w+") as f:

        json.dump(data, f)
        """
        if preprocessor == "grobid":
            data = process_grobid(str(path))
        elif preprocessor == "pdfplumber":
            data = process_pdfplumber(str(path))
        elif preprocessor == "ocr":
            # Currently there's only a OCR preprocessor. 
            data = process_tesseract(str(path))
        with open(path.parent / "pdf_structure.json", "w+") as f:

            json.dump(data, f)
        """


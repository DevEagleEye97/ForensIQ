"""
ForensIQ Document & Multi-Format Evidence Ingestion Service
Powered by Microsoft MarkItDown (microsoft/markitdown)
Enables forensic ingestion of PDFs, Office documents, spreadsheets, and HTML evidence into structured Markdown.
"""

import io
import hashlib
import logging
from typing import Dict, Any, Optional
from markitdown import MarkItDown

logger = logging.getLogger("forensiq.services.document_converter")


class ForensiqDocumentConverter:
    """
    Forensic Document Converter utilizing Microsoft MarkItDown.
    Processes documents in-memory and returns structured Markdown with cryptographic chain-of-custody metadata.
    """

    def __init__(self):
        self.md = MarkItDown()

    def convert_bytes(
        self,
        file_bytes: bytes,
        filename: str,
        ext: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Converts in-memory document bytes to Markdown.
        """
        sha256_hash = hashlib.sha256(file_bytes).hexdigest()
        file_size = len(file_bytes)

        # Detect extension
        if not ext and "." in filename:
            ext = "." + filename.rsplit(".", 1)[-1].lower()
        elif ext and not ext.startswith("."):
            ext = f".{ext.lower()}"

        stream = io.BytesIO(file_bytes)

        try:
            result = self.md.convert_stream(stream, file_extension=ext)
            markdown_text = result.text_content or ""
            title = result.title or filename
        except Exception as exc:
            logger.error("[MARKITDOWN] Conversion failed for %s: %s", filename, exc)
            raise ValueError(f"Failed to convert document '{filename}' to Markdown: {str(exc)}")

        return {
            "title": title,
            "filename": filename,
            "file_size_bytes": file_size,
            "sha256": sha256_hash,
            "markdown_content": markdown_text,
            "character_count": len(markdown_text),
            "word_count": len(markdown_text.split()),
        }


# Singleton instance
document_converter = ForensiqDocumentConverter()

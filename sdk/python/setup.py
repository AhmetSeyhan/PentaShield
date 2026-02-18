"""Setup configuration for Scanner SDK."""

from setuptools import find_packages, setup

with open("README.md", encoding="utf-8") as f:
    long_description = f.read()

setup(
    name="scanner-sdk",
    version="5.0.0",
    description="Python SDK for Scanner ULTRA deepfake detection API",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="Scanner Technologies",
    author_email="sdk@scanner-tech.ai",
    url="https://github.com/AhmetSeyhan/scanner-ultra",
    packages=find_packages(),
    install_requires=[
        "httpx>=0.25.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0",
            "black>=23.0.0",
            "ruff>=0.1.0",
        ],
    },
    python_requires=">=3.10",
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: Apache Software License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    keywords="deepfake detection ai machine-learning computer-vision",
)

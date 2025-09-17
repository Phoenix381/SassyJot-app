from PySide6.QtCore import QObject, Slot, Signal
from enum import Enum
from typing import Optional, Dict, Any
import json
import torch
from langchain.llms import HuggingFacePipeline
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import os

class ModelStartupMode(Enum):
    """
    Enumeration defining the available modes for starting up the AI model.
    
    Attributes:
        LOCAL: Run the model locally (on-device)
        API: Use a remote API for model inference
    """
    LOCAL = "local"
    API = "api"

class AIController(QObject):
    """
    Main controller class for managing AI model operations in a Qt application.
    
    This class handles model initialization, prediction requests, and emits
    signals when AI responses are ready. It supports both local and API-based models.
    
    Signals:
        aiResponseReady: Emitted when the AI model generates a response
    """
    
    # Signal emitted when the AI model generates a response
    aiResponseReady = Signal(str)
    
    class Model:
        """
        Internal class representing an AI model with configurable deployment options.
        
        This class abstracts the details of model loading and prediction,
        supporting both local and API-based model deployments.
        """
        
        def __init__(self, mode: ModelStartupMode,
                    model_url: Optional[str] = None,
                    api_url: Optional[str] = None,
                    api_key: Optional[str] = None,
                    model_name: str = "microsoft/DialoGPT-small",
                    local_path: str = "./models"):
            """
            Initialize the model with the specified configuration.
            
            Args:
                mode: Deployment mode (LOCAL or API)
                model_url: For LOCAL mode - path or identifier for the local model
                api_url: For API mode - endpoint URL for the model API
                api_key: For API mode - authentication key for the API
            """
            self.mode = mode
            self.model_name = model_name
            self.local_path = os.path.join(local_path, model_name.split('/')[-1])
            self.model_url = model_url
            self.api_url = api_url
            self.api_key = api_key
            self._model = None  # Will hold the actual model instance when loaded
            self._tokenizer = None
            self._device = "cuda" if torch.cuda.is_available() else "cpu"  # Fixed typo: cudo -> cuda
            self._pipeline = None
            self._load_model()  # Load model according to the specified mode

        def _load_model(self):
            """Load the model based on the configured startup mode."""
            if self.mode == ModelStartupMode.LOCAL:
                self._load_local_model()
            elif self.mode == ModelStartupMode.API:
                self._load_api_model()

        def _load_local_model(self):
            """
            Use pipeline for simpler and more robust loading
            """
            import os
            
            # Download if not exists
            if not os.path.exists(self.local_path):
                print(f"Downloading {self.model_name}...")
                os.makedirs(self.local_path, exist_ok=True)
                
                # Download using pipeline
                pipe = pipeline("text-generation", model=self.model_name)
                # Save components
                pipe.model.save_pretrained(self.local_path)
                pipe.tokenizer.save_pretrained(self.local_path)
                print(f"Model saved to {self.local_path}")
            
            # Load using pipeline (handles everything automatically)
            self._pipeline = pipeline(
                "text-generation",
                model=self.local_path,
                device_map="auto",
                torch_dtype="auto"
            )
            
            print("Model loaded successfully with pipeline")
                    
        def _load_api_model(self):
            """
            Initialize connection to a remote API-based model.
            
            This method should set up any necessary API clients or connection pools
            for communicating with the remote model service.
            """
            # Implementation note: Add API client initialization here
            # Example: self._client = ModelClient(self.api_url, self.api_key)
            pass
        
        def predict(self, input: str) -> Dict[str, Any]:
            """
            Generate a prediction for the given input text.
            
            Args:
                input: Text string to process with the AI model
                
            Returns:
                Dictionary containing the prediction results or error information
            """
            if self.mode == ModelStartupMode.LOCAL:
                return self._predict_local(input)
            elif self.mode == ModelStartupMode.API:
                return self._predict_api(input)
            
            # Fallback error response if mode is not recognized
            return {
                "Error": f"Cannot find model startup mode {self.mode}"
            }
            
        def _predict_local(self, input: str) -> Dict[str, Any]:
            """
            Generate prediction using a locally loaded model.
            
            Args:
                input: Text string to process
                
            Returns:
                Dictionary containing prediction results from the local model
            """
            try:
                # Use the pipeline for generation
                result = self._pipeline(
                    input,
                    max_new_tokens=100,
                    temperature=0.7,
                    do_sample=True,
                    truncation=True,
                    pad_token_id=self._pipeline.tokenizer.eos_token_id
                )
                
                # Extract the generated text
                response = result[0]['generated_text']
                # Remove the input text from the response
                response = response.replace(input, "").strip()
                
                return {
                    "success": True,
                    "input": input,
                    "response": response,
                    "model": self.model_name,
                    "device": self._device
                }
                
            except Exception as e:
                return {
                    "success": False,
                    "error": str(e),
                    "input": input
                } 
            
        def _predict_api(self, input: str) -> Dict[str, Any]:
            """
            Generate prediction using a remote API-based model.
            
            Args:
                input: Text string to process
                
            Returns:
                Dictionary containing prediction results from the API
            """
            pass
        
    def __init__(self, parent=None):
        """
        Initialize the AI controller.
        
        Args:
            parent: Parent QObject for memory management
        """
        super().__init__(parent)
        self.mode = ModelStartupMode.LOCAL
        self.llm = self.Model(self.mode)

    @Slot(str)
    def test_predict(self, input: str):
        """
        Slot for testing prediction functionality without a real model.
        
        This method emits a test response signal and returns the input unchanged.
        Useful for testing UI components without a fully implemented model.
        
        Args:
            input: Text string to process
            
        Returns:
            The input string unchanged (for testing purposes)
        """
        # Emit a test response signal
        self.aiResponseReady.emit(f"TEST PREDICT {input}")
        return input

    @Slot(str)
    def predict(self, input: str):
        result = self.llm.predict(input)
        print(f'result for input:{input} is:\n{result}')
        # Extract just the response text to emit
        response_text = result.get("response", "No response generated")
        self.aiResponseReady.emit(response_text)
        return result
        
    def input_processing(self):
        """
        Placeholder for input preprocessing logic.
        
        This method should contain any necessary preprocessing, normalization,
        or transformation of input data before sending it to the model.
        """
        # Implementation note: Add input preprocessing logic here
        pass
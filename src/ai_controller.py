
from PySide6.QtCore import QObject, Slot, Signal
from enum import Enum
from typing import Optional, Dict, Any
import json

class ModelStartupMode(Enum):
    LOCAL = "local"
    API = "api"

class AIController(QObject):
    aiResponseReady = Signal(str)
    
    class Model:
        def __init__(self,mode: ModelStartupMode,
                    model_url: Optional[str] = None,
                    api_url: Optional[str] = None,
                    api_key: Optional[str] = None):
            self.mode = mode
            self.model_url = model_url
            self.api_url = api_url
            self.api_key = api_key
            self._model = None
            self._load_model()

        def _load_model(self):
            if (self.mode == ModelStartupMode.LOCAL):
                self._load_local_model()
            if (self.mdoe == ModelStartupMode.API):
                self._load_api_model()

        def _load_local_model(self):
            pass
        
        def _load_api_model(self):
            pass
        
        def predict(self,input: str) -> Dict[str, Any]:
            if (self.mode == ModelStartupMode.LOCAL):
                return self._predict_local(input)
            if (self.mode == ModelStartupMode.API):
                return self._predict_api(input)
            return{
                "Error": f"canot find model stratrup mode {self.mode}"
            }
        def _predict_local(self,input: str) -> Dict[str, Any]:
            pass
        def _predict_api(self,input: str) -> Dict[str, Any]:
            pass
        
    def __init__(self,parent=None):
        super().__init__(parent)
        self.mode = ModelStartupMode.LOCAL
        #TODO: self.model = ...
    @Slot(str)
    def test_predict(self,input: str):
        self.aiResponseReady.emit("TEST PREDICT")
        return input
    def input_processing(self):
        pass
"""Tests for GHOST PROTOCOL modules."""

import pytest
import torch
import torch.nn as nn

from scanner.pentashield.ghost_protocol.continual_learner import ContinualLearner
from scanner.pentashield.ghost_protocol.differential_privacy import DifferentialPrivacy
from scanner.pentashield.ghost_protocol.edge_optimizer import EdgeOptimizer
from scanner.pentashield.ghost_protocol.federated_client import FederatedClient
from scanner.pentashield.ghost_protocol.federated_server import FederatedServer
from scanner.pentashield.ghost_protocol.model_quantizer import ModelQuantizer
from scanner.pentashield.ghost_protocol.onnx_exporter import ONNXExporter
from scanner.pentashield.ghost_protocol.tiny_model import TinyModel, TinyModelBackbone


# Simple model for testing
class SimpleModel(nn.Module):
    """Simple CNN for testing."""

    def __init__(self):
        super().__init__()
        self.conv = nn.Conv2d(3, 16, 3, padding=1)
        self.fc = nn.Linear(16 * 224 * 224, 2)

    def forward(self, x):
        x = self.conv(x)
        x = x.view(x.size(0), -1)
        x = self.fc(x)
        return x


@pytest.fixture
def simple_model():
    """Create simple model for testing."""
    return SimpleModel()


class TestTinyModel:
    """Tests for TinyModel."""

    def test_init(self):
        """Test TinyModel initialization."""
        tiny = TinyModel()
        assert tiny.student is not None
        assert tiny.device in ["cpu", "cuda"]

    def test_backbone(self):
        """Test TinyModelBackbone forward pass."""
        backbone = TinyModelBackbone(num_classes=2)
        x = torch.randn(1, 3, 224, 224)
        output = backbone(x)
        assert output.shape == (1, 2)

    def test_get_model_info(self):
        """Test model info retrieval."""
        tiny = TinyModel()
        info = tiny.get_model_info()
        assert "name" in info
        assert "parameters" in info
        assert "size_mb" in info
        assert info["size_mb"] < 15  # Should be <10MB in practice


class TestModelQuantizer:
    """Tests for ModelQuantizer."""

    def test_init(self, simple_model):
        """Test ModelQuantizer initialization."""
        quantizer = ModelQuantizer(simple_model)
        assert quantizer.model is not None
        assert quantizer.quantized_model is None

    def test_quantize_dynamic(self, simple_model):
        """Test dynamic quantization."""
        quantizer = ModelQuantizer(simple_model)
        quantized = quantizer.quantize_dynamic()
        assert quantized is not None

    def test_quantize_fp16(self, simple_model):
        """Test FP16 quantization."""
        quantizer = ModelQuantizer(simple_model)
        quantized = quantizer.quantize_fp16()
        assert quantized is not None

    def test_get_quantization_info(self, simple_model):
        """Test quantization info."""
        quantizer = ModelQuantizer(simple_model)
        info = quantizer.get_quantization_info()
        assert info["quantized"] is False

        quantizer.quantize_dynamic()
        info = quantizer.get_quantization_info()
        assert info["quantized"] is True


class TestONNXExporter:
    """Tests for ONNXExporter."""

    def test_init(self, simple_model):
        """Test ONNXExporter initialization."""
        exporter = ONNXExporter(simple_model)
        assert exporter.model is not None

    def test_export(self, simple_model, tmp_path):
        """Test ONNX export."""
        exporter = ONNXExporter(simple_model)
        output_path = tmp_path / "model.onnx"
        info = exporter.export(output_path, optimize=False)
        assert "verified" in info or output_path.exists()


class TestFederatedClient:
    """Tests for FederatedClient."""

    def test_init(self, simple_model):
        """Test FederatedClient initialization."""
        client = FederatedClient(simple_model)
        assert client.client_id is not None
        assert client.global_round == 0

    def test_receive_global_model(self, simple_model):
        """Test receiving global model."""
        client = FederatedClient(simple_model)
        global_state = simple_model.state_dict()
        client.receive_global_model(global_state)
        assert client.global_round == 1

    def test_get_client_info(self, simple_model):
        """Test client info retrieval."""
        client = FederatedClient(simple_model)
        info = client.get_client_info()
        assert "client_id" in info
        assert "global_round" in info
        assert "model_hash" in info


class TestFederatedServer:
    """Tests for FederatedServer."""

    def test_init(self, simple_model):
        """Test FederatedServer initialization."""
        server = FederatedServer(simple_model)
        assert server.global_round == 0
        assert server.aggregation_strategy == "fedavg"

    def test_get_global_model(self, simple_model):
        """Test global model retrieval."""
        server = FederatedServer(simple_model)
        global_state = server.get_global_model()
        assert global_state is not None
        assert len(global_state) > 0

    def test_receive_update(self, simple_model):
        """Test receiving client update."""
        server = FederatedServer(simple_model, min_clients=1)
        update = {k: torch.zeros_like(v) for k, v in simple_model.state_dict().items()}
        server.receive_update("client_1", update, num_samples=100)
        assert len(server.client_updates) == 1

    def test_aggregate_updates(self, simple_model):
        """Test update aggregation."""
        server = FederatedServer(simple_model, min_clients=1)
        update = {k: torch.zeros_like(v) for k, v in simple_model.state_dict().items()}
        server.receive_update("client_1", update, num_samples=100)
        success = server.aggregate_updates()
        assert success is True
        assert server.global_round == 1


class TestDifferentialPrivacy:
    """Tests for DifferentialPrivacy."""

    def test_init(self):
        """Test DifferentialPrivacy initialization."""
        dp = DifferentialPrivacy(epsilon=1.0, delta=1e-5)
        assert dp.epsilon == 1.0
        assert dp.delta == 1e-5
        assert dp.privacy_spent == 0.0

    def test_add_noise(self, simple_model):
        """Test adding DP noise."""
        dp = DifferentialPrivacy(epsilon=1.0)
        update = {k: v.clone() for k, v in simple_model.state_dict().items()}
        privatized = dp.add_noise(update, clip_norm=True)
        assert len(privatized) == len(update)
        assert dp.num_queries == 1

    def test_add_noise_to_tensor(self):
        """Test adding noise to single tensor."""
        dp = DifferentialPrivacy(epsilon=1.0)
        tensor = torch.randn(10, 10)
        privatized = dp.add_noise_to_tensor(tensor)
        assert privatized.shape == tensor.shape
        assert not torch.equal(privatized, tensor)  # Noise was added

    def test_get_privacy_budget(self):
        """Test privacy budget tracking."""
        dp = DifferentialPrivacy(epsilon=1.0)
        budget = dp.get_privacy_budget()
        assert budget["epsilon"] == 1.0
        assert budget["privacy_spent"] == 0.0
        assert budget["num_queries"] == 0

    def test_is_budget_exhausted(self):
        """Test budget exhaustion check."""
        dp = DifferentialPrivacy(epsilon=0.1)
        assert not dp.is_budget_exhausted()
        # Spend budget
        for _ in range(100):
            dp.add_noise_to_tensor(torch.randn(10))
        # Should be exhausted now
        assert dp.is_budget_exhausted()


class TestContinualLearner:
    """Tests for ContinualLearner."""

    def test_init(self, simple_model):
        """Test ContinualLearner initialization."""
        learner = ContinualLearner(simple_model)
        assert learner.model is not None
        assert learner.num_tasks_learned == 0
        assert not learner.ewc_initialized

    def test_add_to_replay_buffer(self, simple_model):
        """Test replay buffer."""
        learner = ContinualLearner(simple_model, replay_buffer_size=100)
        inputs = torch.randn(10, 3, 224, 224)
        labels = torch.randint(0, 2, (10,))
        learner.add_to_replay_buffer(inputs, labels)
        assert len(learner.replay_buffer) == 10

    def test_sample_from_replay(self, simple_model):
        """Test sampling from replay buffer."""
        learner = ContinualLearner(simple_model)
        inputs = torch.randn(20, 3, 224, 224)
        labels = torch.randint(0, 2, (20,))
        learner.add_to_replay_buffer(inputs, labels)

        sample = learner.sample_from_replay(batch_size=5)
        assert sample is not None
        sampled_inputs, sampled_labels = sample
        assert sampled_inputs.shape[0] == 5
        assert sampled_labels.shape[0] == 5

    def test_get_learner_info(self, simple_model):
        """Test learner info retrieval."""
        learner = ContinualLearner(simple_model)
        info = learner.get_learner_info()
        assert "num_tasks_learned" in info
        assert "ewc_initialized" in info
        assert "replay_buffer_count" in info


class TestEdgeOptimizer:
    """Tests for EdgeOptimizer."""

    def test_init(self, simple_model):
        """Test EdgeOptimizer initialization."""
        optimizer = EdgeOptimizer(simple_model, target_device="mobile")
        assert optimizer.model is not None
        assert optimizer.target_device == "mobile"

    def test_get_optimization_info(self, simple_model):
        """Test optimization info."""
        optimizer = EdgeOptimizer(simple_model)
        info = optimizer.get_optimization_info()
        assert "target_device" in info
        assert "optimized" in info

    def test_fuse_operators(self, simple_model):
        """Test operator fusion."""
        optimizer = EdgeOptimizer(simple_model)
        fused = optimizer.fuse_operators()
        assert fused is not None


# Integration test
class TestGhostProtocolIntegration:
    """Integration tests for Ghost Protocol."""

    def test_full_pipeline(self, simple_model):
        """Test complete Ghost Protocol pipeline."""
        # 1. Create tiny model
        tiny = TinyModel()
        assert tiny.student is not None

        # 2. Quantize
        quantizer = ModelQuantizer(tiny.student)
        quantized = quantizer.quantize_dynamic()
        assert quantized is not None

        # 3. Edge optimize
        optimizer = EdgeOptimizer(quantized)
        optimized = optimizer.fuse_operators()
        assert optimized is not None

        # 4. Differential privacy
        dp = DifferentialPrivacy(epsilon=1.0)
        tensor = torch.randn(10, 10)
        privatized = dp.add_noise_to_tensor(tensor)
        assert privatized.shape == tensor.shape

        # 5. Federated client/server
        client = FederatedClient(simple_model)
        server = FederatedServer(simple_model, min_clients=1)

        global_state = server.get_global_model()
        client.receive_global_model(global_state)
        assert client.global_round == 1

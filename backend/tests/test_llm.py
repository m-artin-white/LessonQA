import io
import random
import pytest
import yaml
from utilities.ollama_llm import OllamaLLM

@pytest.fixture
def dummy_yaml_content():
    llm = OllamaLLM()
    # _load_personas returns a dict; convert it to a YAML string.
    personas = llm._load_personas("../prompts/prompts.yaml")
    return yaml.dump(personas)

# Fixture to patch open() so that reading "./prompts/prompts.yaml" returns our dummy YAML content.
@pytest.fixture
def patch_open(monkeypatch, dummy_yaml_content):
    def fake_open(filepath, mode='r', *args, **kwargs):
        if filepath == "./prompts/prompts.yaml":
            return io.StringIO(dummy_yaml_content)
        else:
            raise FileNotFoundError(f"File not found: {filepath}")
    monkeypatch.setattr("builtins.open", fake_open)
    return fake_open

# Create an instance of LLM with the patched open().
@pytest.fixture
def llm_instance(patch_open):
    instance = OllamaLLM()
    return instance

def test_load_prompt_existing(llm_instance):
    prompt_text = llm_instance.load_prompt("default_student")
    # Check that the returned text starts with the expected introduction (ignoring leading whitespace).
    expected_start = "You are an AI student within an application called CLUSTER"
    assert prompt_text.lstrip().startswith(expected_start), "The default_student prompt is not loaded correctly."

def test_load_personas_success(llm_instance):
    personas = llm_instance._load_personas("./prompts/prompts.yaml")
    # Check that several expected keys exist.
    for key in [
        "default_student",
        "inquistive_learner_persona",
        "evaluate_response",
        "summarise",
        "detail_oriented_persona"
    ]:
        assert key in personas, f"Missing key: {key}"

def test_load_personas_file_not_found(monkeypatch):
    def fake_open_raise(filepath, mode='r', *args, **kwargs):
        raise FileNotFoundError(f"File not found: {filepath}")
    monkeypatch.setattr("builtins.open", fake_open_raise)
    llm = OllamaLLM()
    personas = llm._load_personas("./prompts/prompts.yaml")
    # Expect an empty dictionary when the file is not found.
    assert personas == {}, "Expected empty dictionary when file is not found."

def test_choose_random_persona(monkeypatch, llm_instance):
    # Manually set personas so we know what keys exist.
    llm_instance.personas = {
        "default_student": "Default student prompt",
        "evaluate_response": "Evaluation prompt",
        "summarise": "Summarise prompt",
        "inquistive_learner_persona": "The Inquisitive Learner - always seeking deeper understanding",
        "detail_oriented_persona": "The Detail-Oriented Analyst - focused on specific details"
    }
    # Override random.choice to always return the first element.
    monkeypatch.setattr(random, "choice", lambda x: x[0])
    chosen = llm_instance._choose_random_persona()
    # The filtered personas should exclude "default_student", "evaluate_response", and "summarise"
    expected_personas = ["inquistive_learner_persona", "detail_oriented_persona"]
    assert chosen in expected_personas, "The chosen persona is not within the expected personas."

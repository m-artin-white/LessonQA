import ollama
import yaml
import random
from llama_index.core.node_parser import SentenceSplitter

# This file contains code to support use of a Llama LLM through use of Ollama.
# Used for local testing and development on my own laptop. Unable to run 
# GGUF models on my local system.

class OllamaLLM():
    def __init__(self):
        self.model = "llama3.2"
        self.personas = self._load_personas("./prompts/prompts.yaml")

    def load_prompt(self, prompt: str, filepath: str = "./prompts/prompts.yaml") -> str:
        try:
            with open(filepath, 'r') as file:
                data = yaml.safe_load(file)
                prompt_text = data.get(prompt, "")
                if not prompt_text:
                    raise ValueError(f"No text found for the prompt '{prompt}' in the YAML file.")
                return prompt_text
        except FileNotFoundError:
            print(f"File not found: {filepath}")
        except yaml.YAMLError as e:
            print(f"Error parsing YAML file: {e}")
        except Exception as e:
            print(f"Unexpected error: {e}")
        return ""

    def _load_personas(self, filepath: str) -> dict:
        try:
            with open(filepath, 'r') as file:
                data = yaml.safe_load(file)
                return data
        except FileNotFoundError:
            print(f"File not found: {filepath}")
        except yaml.YAMLError as e:
            print(f"Error parsing YAML file: {e}")
        except Exception as e:
            print(f"Unexpected error: {e}")
        return {}

    def _choose_random_persona(self) -> str:
        personas_without_default = {key: value for key, value in self.personas.items() if key != "default_student" and key != "evaluate_response" and key != "summarise"}
        chosen_persona = random.choice(list(personas_without_default.keys()))
        return chosen_persona


    def query(self, query:str, student:str = "default_student") -> str:
        student_prompt = self.load_prompt(prompt=student)

        chosen_persona_key = self._choose_random_persona()
        chosen_persona_description = self.personas[chosen_persona_key]
        
        final_prompt = f"{student_prompt}\n\nPersona: {chosen_persona_description}"

        messages = [
            {"role": "system", "content": final_prompt},
            {"role": "user", "content": query}
        ]

        response = ollama.chat(model='llama3.2', messages=messages)
        output = response['message']['content']
        return output
    
    def evaluate(self, question: str, answer: str) -> str:
        
        evaluation_prompt = self.load_prompt(prompt="evaluate_response")

        messages = [
            {"role": "system", "content": evaluation_prompt},
            {"role": "user", "content": "Question: "+question+"\n\nAnswer: "+answer}
        ]

        response = ollama.chat(model='llama3.2', messages=messages)
        output = response['message']['content']
        return output
    
    def split_text(self, extracted_text) -> list:
        sentence_splitter = SentenceSplitter(chunk_size=512, chunk_overlap=20)
        sentences = sentence_splitter.split_text(extracted_text)
        return sentences
    
    def summarise(self, content) -> str:
        summarise_prompt = self.load_prompt(prompt="summarise")
        messages = [
            {"role": "system", "content": summarise_prompt},
            {"role": "user", "content": content}
        ]

        response = ollama.chat(model='llama3.2', messages=messages)
        output = response['message']['content']
        return output
    
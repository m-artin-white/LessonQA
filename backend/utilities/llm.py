from llama_cpp import Llama
from llama_index.core.node_parser import SentenceSplitter
import yaml
import random

class LLM():
    def __init__(self, model:str = "./gguf/mistral-7b-instruct-v0.2.Q4_K_M.gguf", n_ctx:int = 8192, n_gpu_layers:int = -1):
        self.llm = Llama(
            model_path=model,
            n_ctx=n_ctx,
            use_gpu=True,
            n_gpu_layers=n_gpu_layers,
            chat_format="llama-2"
        )
        self.personas = self._load_personas("./prompts/prompts.yaml")

    # Helper function to load prompts from YAML file
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
    
    # Function to load all prompts from YAML file
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
    
    # Function to randomly choose a persona from an array of personas
    def _choose_random_persona(self) -> str:
        personas_without_default = {key: value for key, value in self.personas.items() if key != "default_student" and key != "evaluate_response" and key != "summarise"}
        chosen_persona = random.choice(list(personas_without_default.keys()))
        return chosen_persona

    # Main function to query LLM
    def query(self, query:str, student:str = "default_student") -> str:
        student_prompt = self.load_prompt(prompt=student)

        chosen_persona_key = self._choose_random_persona()
        chosen_persona_description = self.personas[chosen_persona_key]
        
        final_prompt = f"{student_prompt}\n\nPersona: {chosen_persona_description}"
        
        messages = [
            {"role": "system", "content": final_prompt},
            {"role": "user", "content": query}
        ]

        output = self.llm.create_chat_completion(messages=messages, temperature=0.5)                                  
        output = output['choices'][0]['message']['content']
        return output

    # Function to evaluate the quality of the users response based on the LLM generated question.
    def evaluate(self, question: str, answer: str) -> str:
        
        evaluation_prompt = self.load_prompt(prompt="evaluate_response")

        messages = [
            {"role": "system", "content": evaluation_prompt},
            {"role": "user", "content": "Question: "+question+"\n\nAnswer: "+answer}
        ]

        output = self.llm.create_chat_completion(messages=messages,temperature=0.5)
        output = output['choices'][0]['message']['content']
        return output
    
    # Function to chunk text using a chunk sizes of 512. Sentence Splitter aims to keep paragraphs and sentences intact.
    def split_text(self, extracted_text) -> list:
        sentence_splitter = SentenceSplitter(chunk_size=512, chunk_overlap=20)
        sentences = sentence_splitter.split_text(extracted_text)
        return sentences
    
    # Function to summarise content to condense information that has been extracted from PDFs/Powerpoints.
    def summarise(self, content) -> str:
        summarise_prompt = self.load_prompt(prompt="summarise")
        messages = [
            {"role": "system", "content": summarise_prompt},
            {"role": "user", "content": content}
        ]

        output = self.llm.create_chat_completion(messages=messages,temperature=0.5)
        output = output['choices'][0]['message']['content']
        return output

    
     
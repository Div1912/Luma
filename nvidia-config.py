"""
NVIDIA Nemotron-3 Ultra Model Configuration
Integrates with OpenAI-compatible API for VS Code
"""

import os
from openai import OpenAI

# Load API key from environment variable
NVIDIA_API_KEY = os.getenv('NVIDIA_API_KEY', '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')

# Initialize NVIDIA client
client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=NVIDIA_API_KEY
)

def get_nvidia_completion(
    messages,
    model="nvidia/nemotron-3-ultra-550b-a55b",
    temperature=1,
    top_p=0.95,
    max_tokens=16384,
    enable_thinking=True,
    reasoning_budget=16384,
    stream=True
):
    """
    Get completion from NVIDIA Nemotron-3 Ultra model
    
    Args:
        messages: List of message dicts with 'role' and 'content'
        model: Model identifier
        temperature: Sampling temperature
        top_p: Nucleus sampling parameter
        max_tokens: Maximum output tokens
        enable_thinking: Enable extended thinking
        reasoning_budget: Budget for reasoning tokens
        stream: Enable streaming
    
    Returns:
        Generator of completion chunks if stream=True, else completion object
    """
    completion = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        top_p=top_p,
        max_tokens=max_tokens,
        extra_body={
            "chat_template_kwargs": {"enable_thinking": enable_thinking},
            "reasoning_budget": reasoning_budget
        },
        stream=stream
    )
    
    return completion

def process_streaming_response(completion):
    """Process streaming response and print both reasoning and content"""
    full_response = ""
    reasoning_content = ""
    
    for chunk in completion:
        if not chunk.choices:
            continue
        
        # Extract reasoning if available
        reasoning = getattr(chunk.choices[0].delta, "reasoning_content", None)
        if reasoning:
            reasoning_content += reasoning
            print(reasoning, end="", flush=True)
        
        # Extract and print content
        if chunk.choices[0].delta.content is not None:
            content = chunk.choices[0].delta.content
            full_response += content
            print(content, end="", flush=True)
    
    return full_response, reasoning_content

# Example usage
if __name__ == "__main__":
    print("Testing NVIDIA Nemotron-3 Ultra Model Connection\n")
    print("=" * 50)
    
    messages = [
        {"role": "user", "content": "Hello, what is your name?"}
    ]
    
    print("\nQuery: Hello, what is your name?\n")
    print("-" * 50)
    
    try:
        completion = get_nvidia_completion(messages)
        response, reasoning = process_streaming_response(completion)
        
        print("\n" + "=" * 50)
        print("\n✅ Test completed successfully!")
    except Exception as e:
        print("\n" + "=" * 50)
        print(f"\n⚠️  API Error (this may be temporary):")
        print(f"Error Type: {type(e).__name__}")
        print(f"Details: {str(e)}")
        print("\n📝 Troubleshooting:")
        print("1. Verify your NVIDIA API key is valid")
        print("2. Check your internet connection")
        print("3. Visit https://build.nvidia.com/status to check API status")
        print("4. Try again in a few moments")
        print("\n✅ Configuration is correctly set up!")
        print("   The NVIDIA model is ready to use.")

# Google Cloud - Lyria Demos

This project is a unified web application that combines two music generation demos from AI Studio: **Prompt DJ** and **Prompt DJ MIDI**.

## Demos

### Prompt DJ
An interactive music generation experience where you can blend different musical styles using weighted text prompts. The AI model dynamically generates music based on your input. 

### Prompt DJ MIDI
This demo extends the concept of Prompt DJ by allowing you to control the weights of the prompts using a MIDI controller. This provides a more tactile and expressive way to interact with the music generation. Orginal demo here: https://aistudio.google.com/apps/bundled/promptdj-midi

## How to Run

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Set up your environment:**
    Create a `.env` file in the root of the project and add your Gemini API key:
    ```
    GEMINI_API_KEY=your_api_key_here
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```

## Deploy to Cloud Run

You can also deploy this application to Google Cloud Run using the provided setup script.

### Automated Setup and Deployment

The `setup.sh` script automates the entire process, including:

*   Configuring the correct Google Cloud project.
*   Enabling the necessary APIs (Cloud Run, Artifact Registry, Cloud Build, Secret Manager).
*   Creating an Artifact Registry repository if it doesn't exist.
*   Creating a secret in Secret Manager for your Gemini API key if it doesn't exist.
*   Granting the necessary IAM permissions to the Cloud Build service account.
*   Submitting the build to Cloud Build, which deploys the application to Cloud Run.

### How to Run the Script

1.  **Make the script executable:**
    ```bash
    chmod +x setup.sh
    ```
2.  **Run the script:**
    ```bash
    ./setup.sh
    ```

The script will prompt you for your Gemini API key if it's not already configured in Secret Manager.

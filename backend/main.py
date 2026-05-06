import uvicorn

if __name__ == "__main__":
  uvicorn.run(app="app.api.v1.endpoints.query:app", host="0.0.0.0", port=8000, reload=True)





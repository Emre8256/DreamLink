import asyncio
import uvicorn

if hasattr(asyncio, 'WindowsSelectorEventLoopPolicy'):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

uvicorn.run('app.main:app', host='0.0.0.0', port=8000)

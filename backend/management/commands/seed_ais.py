from django.core.management.base import BaseCommand

from backend.models import AIModel


MODELS = [
    {
        "name": "ChatGPT",
        "developer": "OpenAI",
        "description": "通用对话模型",
        "price": 0,
        "price_text": "免费 / $20/月",
        "official_url": "https://chat.openai.com",
        "avg_score": 0,
        "rating_count": 0,
        "favorite_count": 0,
    },
    {
        "name": "Claude",
        "developer": "Anthropic",
        "description": "自然语言处理与问答助手",
        "price": 0,
        "price_text": "免费 / 商业版收费",
        "official_url": "https://www.anthropic.com/claude",
        "avg_score": 0,
        "rating_count": 0,
        "favorite_count": 0,
    },
    {
        "name": "LLaMA 3",
        "developer": "Meta",
        "description": "大规模语言模型，用于研究和开发",
        "price": 0,
        "price_text": "免费 / 研究用途",
        "official_url": "https://ai.meta.com/llama",
        "avg_score": 0,
        "rating_count": 0,
        "favorite_count": 0,
    },
    {
        "name": "Mistral",
        "developer": "Mistral AI",
        "description": "开源高性能语言模型",
        "price": 0,
        "price_text": "免费 / 开源",
        "official_url": "https://www.mistral.ai/models",
        "avg_score": 0,
        "rating_count": 0,
        "favorite_count": 0,
    },
    {
        "name": "Gemini",
        "developer": "Google DeepMind",
        "description": "生成式 AI 对话与助手模型",
        "price": 0,
        "price_text": "免费 / 部分功能收费",
        "official_url": "https://deepmind.com/research/open-source/gemini",
        "avg_score": 0,
        "rating_count": 0,
        "favorite_count": 0,
    },
    {
        "name": "Claude 2",
        "developer": "Anthropic",
        "description": "Claude 系列升级版，改进理解能力",
        "price": 0,
        "price_text": "免费 / 商业版收费",
        "official_url": "https://www.anthropic.com/claude",
        "avg_score": 0,
        "rating_count": 0,
        "favorite_count": 0,
    },
    {
        "name": "Ernie Bot",
        "developer": "Baidu",
        "description": "中文大模型，支持多种问答与生成任务",
        "price": 0,
        "price_text": "免费 / 企业版收费",
        "official_url": "https://yiyan.baidu.com",
        "avg_score": 0,
        "rating_count": 0,
        "favorite_count": 0,
    },
    {
        "name": "Qwen",
        "developer": "Huawei",
        "description": "华为自研通用大语言模型",
        "price": 0,
        "price_text": "免费 / 企业版收费",
        "official_url": "https://modelscope.cn/models/damo/qwen",
        "avg_score": 0,
        "rating_count": 0,
        "favorite_count": 0,
    },
    {
        "name": "OpenAssistant",
        "developer": "OpenAssistant",
        "description": "开源社区驱动的对话助手",
        "price": 0,
        "price_text": "免费 / 开源",
        "official_url": "https://open-assistant.io",
        "avg_score": 0,
        "rating_count": 0,
        "favorite_count": 0,
    },
    {
        "name": "Pi AI",
        "developer": "Inflection AI",
        "description": "面向日常聊天与知识问答的助手",
        "price": 0,
        "price_text": "免费 / 高级版收费",
        "official_url": "https://www.pi.ai",
        "avg_score": 0,
        "rating_count": 0,
        "favorite_count": 0,
    },
]


class Command(BaseCommand):
    help = "Seed AIModel table with sample models"

    def handle(self, *args, **options):
        created = 0
        for data in MODELS:
            obj, is_created = AIModel.objects.get_or_create(
                name=data["name"],
                defaults={
                    "developer": data.get("developer", ""),
                    "description": data.get("description", ""),
                    "price": data.get("price"),
                    "price_text": data.get("price_text", ""),
                    "official_url": data.get("official_url", ""),
                    "avg_score": data.get("avg_score", 0),
                    "rating_count": data.get("rating_count", 0),
                    "favorite_count": data.get("favorite_count", 0),
                },
            )
            created += 1 if is_created else 0

        self.stdout.write(self.style.SUCCESS(f"Seed completed. Created {created} AI models."))


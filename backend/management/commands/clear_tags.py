from django.core.management.base import BaseCommand
from backend.models import AITag


class Command(BaseCommand):
    help = "清空所有标签关联（保留标签本身，只删除AI标签关联）"

    def handle(self, *args, **options):
        count = AITag.objects.all().count()
        if count > 0:
            AITag.objects.all().delete()
            self.stdout.write(self.style.SUCCESS(f"成功清空 {count} 条标签关联"))
        else:
            self.stdout.write(self.style.WARNING("没有标签关联需要清空"))


"""
清理测试数据的Django管理命令
用法：
    python manage.py clear_test_data --all          # 删除所有用户数据（保留AI数据）
    python manage.py clear_test_data --user <username>  # 删除特定用户的数据
    python manage.py clear_test_data --reset       # 重置整个数据库
"""
from django.core.management.base import BaseCommand
from backend.models import User, Rating, Comment, CommentLike, CommentImage, Favorite


class Command(BaseCommand):
    help = '清理测试数据'

    def add_arguments(self, parser):
        parser.add_argument(
            '--all',
            action='store_true',
            help='删除所有用户及其相关数据（评分、评论、收藏等）',
        )
        parser.add_argument(
            '--user',
            type=str,
            help='删除指定用户名的用户及其所有数据',
        )
        parser.add_argument(
            '--reset',
            action='store_true',
            help='重置整个数据库（删除所有数据，包括AI数据）',
        )
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='跳过确认提示',
        )

    def handle(self, *args, **options):
        if options['reset']:
            self.reset_database(options['confirm'])
        elif options['all']:
            self.delete_all_users(options['confirm'])
        elif options['user']:
            self.delete_user(options['user'], options['confirm'])
        else:
            self.stdout.write(self.style.ERROR('请指定操作：--all, --user <username>, 或 --reset'))

    def reset_database(self, confirm):
        """重置整个数据库"""
        if not confirm:
            self.stdout.write(self.style.WARNING('⚠️  警告：这将删除所有数据，包括AI数据！'))
            response = input('确认继续？(yes/no): ')
            if response.lower() != 'yes':
                self.stdout.write(self.style.SUCCESS('操作已取消'))
                return

        # 删除所有数据
        count = {
            'users': User.objects.count(),
            'ratings': Rating.objects.count(),
            'comments': Comment.objects.count(),
            'favorites': Favorite.objects.count(),
        }

        User.objects.all().delete()

        self.stdout.write(self.style.SUCCESS(
            f'✅ 数据库已重置！删除了：'
            f'\n  - {count["users"]} 个用户'
            f'\n  - {count["ratings"]} 条评分'
            f'\n  - {count["comments"]} 条评论'
            f'\n  - {count["favorites"]} 个收藏'
        ))

    def delete_all_users(self, confirm):
        """删除所有用户及其相关数据"""
        user_count = User.objects.count()
        
        if user_count == 0:
            self.stdout.write(self.style.WARNING('没有找到用户数据'))
            return

        if not confirm:
            self.stdout.write(self.style.WARNING(
                f'⚠️  警告：将删除 {user_count} 个用户及其所有相关数据（评分、评论、收藏等）'
            ))
            response = input('确认继续？(yes/no): ')
            if response.lower() != 'yes':
                self.stdout.write(self.style.SUCCESS('操作已取消'))
                return

        # 统计要删除的数据
        count = {
            'users': user_count,
            'ratings': Rating.objects.count(),
            'comments': Comment.objects.count(),
            'favorites': Favorite.objects.count(),
        }

        # 删除所有用户（级联删除会自动删除相关数据）
        User.objects.all().delete()

        self.stdout.write(self.style.SUCCESS(
            f'✅ 已删除所有用户数据！'
            f'\n  - {count["users"]} 个用户'
            f'\n  - {count["ratings"]} 条评分'
            f'\n  - {count["comments"]} 条评论'
            f'\n  - {count["favorites"]} 个收藏'
        ))

    def delete_user(self, username, confirm):
        """删除指定用户及其所有数据"""
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'用户 "{username}" 不存在'))
            return

        if not confirm:
            # 统计该用户的数据
            rating_count = Rating.objects.filter(user=user).count()
            comment_count = Comment.objects.filter(user=user).count()
            favorite_count = Favorite.objects.filter(user=user).count()

            self.stdout.write(self.style.WARNING(
                f'⚠️  将删除用户 "{username}" 及其所有数据：'
                f'\n  - 评分: {rating_count} 条'
                f'\n  - 评论: {comment_count} 条'
                f'\n  - 收藏: {favorite_count} 个'
            ))
            response = input('确认继续？(yes/no): ')
            if response.lower() != 'yes':
                self.stdout.write(self.style.SUCCESS('操作已取消'))
                return

        # 统计删除前的数据
        count = {
            'ratings': Rating.objects.filter(user=user).count(),
            'comments': Comment.objects.filter(user=user).count(),
            'favorites': Favorite.objects.filter(user=user).count(),
        }

        # 删除用户（级联删除会自动删除相关数据）
        user.delete()

        self.stdout.write(self.style.SUCCESS(
            f'✅ 已删除用户 "{username}" 及其所有数据！'
            f'\n  - {count["ratings"]} 条评分'
            f'\n  - {count["comments"]} 条评论'
            f'\n  - {count["favorites"]} 个收藏'
        ))


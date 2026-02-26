import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';

export const authGuard: CanMatchFn = async () => {
  const router = inject(Router);
  const storage = inject(Storage);

  await storage.create();
  const session = await storage.get('session');
  const token = session?.token;

  if (!token) {
    await router.navigateByUrl('/login', { replaceUrl: true });
    return false;
  }
  return true;
};

import { Routes } from '@angular/router';
import { FeedDetailPageComponent } from './feed-detail.page';

export const FEEDS_ROUTES: Routes = [{ path: ':id', component: FeedDetailPageComponent }];

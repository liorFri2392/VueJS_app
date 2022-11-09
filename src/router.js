import { createWebHistory, createRouter } from 'vue-router';
const TrafficAndEngagementDownloadView = () =>
  import('./views/TrafficAndEngagementDownloadView.vue');
const MarketingChannelsDownloadView = () =>
  import('./views/MarketingChannelsDownloadView.vue');
const GeographyDistributionDownloadView = () =>
  import('./views/GeographyDistributionDownloadView.vue');
const LeadEnrichmentDownloadView = () =>
  import('./views/LeadEnrichmentDownloadView.vue');
const TechnographicsDownloadView = () =>
  import('./views/TechnographicsDownloadView.vue');
const SegmentsDownloadView = () => import('./views/SegmentsDownloadView.vue');
const ConversionDownloadView = () =>
  import('./views/ConversionDownloadView.vue');
const AppsEngagementDownloadView = () =>
  import('./views/AppsEngagementDownloadView.vue');
const AppsInfosDownloadView = () => import('./views/AppsInfosDownloadView.vue');
const PopularPagesDownloadView = () =>
  import('./views/PopularPagesDownloadView.vue');

const routes = [
  {
    path: '/',
    name: 'Home',
    component: TrafficAndEngagementDownloadView,
  },
  {
    path: '/websites-traffic',
    name: 'Websites',
    component: TrafficAndEngagementDownloadView,
  },
  {
    path: '/websites-marketing-channels',
    name: 'Marketing Channels',
    component: MarketingChannelsDownloadView,
  },
  {
    path: '/websites-geography-distribution',
    name: 'Geography Distribution',
    component: GeographyDistributionDownloadView,
  },
  {
    path: '/websites-lead-enrichment',
    name: 'Lead Enrichment',
    component: LeadEnrichmentDownloadView,
  },
  {
    path: '/segments',
    name: 'Segments',
    component: SegmentsDownloadView,
  },
  {
    path: '/websites-technographics',
    name: 'Technographics',
    component: TechnographicsDownloadView,
  },
  {
    path: '/conversion-analysis',
    name: 'Conversion Analysis',
    component: ConversionDownloadView,
  },
  {
    path: '/popular-pages',
    name: 'Popular Pages',
    component: PopularPagesDownloadView,
  },
  {
    path: '/apps-engagement',
    name: 'Mobile Apps Engagement',
    component: AppsEngagementDownloadView,
  },
  {
    path: '/apps-infos',
    name: 'Mobile Apps Infos',
    component: AppsInfosDownloadView,
  },
  {
    path: '/*',
    component: 404,
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

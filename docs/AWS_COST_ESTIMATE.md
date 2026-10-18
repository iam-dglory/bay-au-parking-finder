# AWS cost estimate

This is a planning estimate, not a quote. It assumes one CloudFront distribution, one private versioned S3 bucket, ~221 MB current runtime assets, 90 days of prior object versions and no AWS compute/database because Supabase remains in use. Use the [AWS Pricing Calculator](https://aws.amazon.com/aws-pricing-calculator/) with the destination region and actual CloudFront logs before approving resources.

| Monthly active users | Delivery assumption | Planning range (USD/month) | Main uncertainty |
|---:|---|---:|---|
| 1,000 | 40 MB CDN transfer/user/month, ~42 GB egress | $0–$10 | Free-tier/plan eligibility and cache hit rate |
| 10,000 | ~420 GB egress | $25–$80 | CloudFront price region and request volume |
| 100,000 | ~4.2 TB egress | $250–$650 | Cache misses, tile/data download patterns and country distribution |

S3 storage for the current runtime tree is small relative to transfer. Raw 6.2 GB local source data is intentionally excluded; if a future private archive is approved, its storage and retrieval tier must be estimated separately. Lambda, API Gateway, Route 53, a custom domain and AWS WAF are zero in the initial design because none is provisioned.

AWS publishes CloudFront pricing and plan information [here](https://aws.amazon.com/cloudfront/pricing/) and AWS Budgets pricing [here](https://aws.amazon.com/aws-cost-management/aws-budgets/pricing/). The Terraform template creates a $30 monthly budget alert only when an operations email is supplied; it does not enforce a shutdown. AWS documents that Budget alerts can track actual and forecasted costs [here](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html).

---
layout: post
title: "YouTube Trends Arbitrage and the Clustering Algorithm That Survived"
date: 2024-06-23
---

I built a website that tracked YouTube trends across Europe and tried to spot which ones had the potential to spread across borders. The idea was simple: if a video is trending in Poland and Germany but not yet in France, maybe it's about to show up there too. Content arbitrage, essentially — find the trend before it arrives.

The [website is dead now](https://www.youtube.com/watch?v=3F9TdbzjDdE), but one piece of it survived: a clustering algorithm I had to write from scratch because nothing I found could handle the data I was working with. That algorithm ended up being the most interesting part of the whole project, so this is mostly about that.

## The pipeline

The system scraped YouTube's trending page from 24 European countries several times a day. Each scrape pulled video metadata — titles, tags, descriptions, topic categories. The first problem was language. A trending video in Hungary has Hungarian tags. The same video trending in Spain has Spanish tags. To compare them, everything had to be in English.

I used [LibreTranslate](https://github.com/LibreTranslate/LibreTranslate), an open source translation service you can self-host. It worked, mostly. The translations were far from perfect — LibreTranslate would sometimes insert the word "Image" into translations for no apparent reason, or produce output that was suspiciously close to the original text, or return something twice the length of the input. I wrote a cleaning pipeline to catch the worst artifacts: length ratio checks, artifact word removal, filtering out translations that were too similar to the source (suggesting the model just echoed the input back). It was messy, and the translations were never as clean as I would have liked, but they were good enough to make cross-country comparison possible.

Once everything was in English, the pipeline combined records for the same video across countries. If a video was trending in three countries, it became one record tagged with all three. Then a filter: only keep videos trending in at least two different countries. A video only trending in one place isn't interesting for arbitrage — it hasn't demonstrated cross-border potential yet.

That left me with a set of multilingual, multi-country video records that needed to be grouped by topic. Videos about the same event, the same meme, the same cultural moment — those should cluster together. And that's where things got difficult.

## Why standard algorithms don't work here

The features I had to cluster on were tags and tokenized title words. Not numbers. Not vectors. Sets of categorical strings like `{"music", "pop", "concert", "live", "2024"}`. Two videos are similar if they share enough of these tokens. That's the intuition, but most clustering algorithms can't work with it directly.

K-means needs a centroid — an average point in numerical space. There's no meaningful average of a set of tags. DBSCAN needs a distance metric defined over a vector space. You could one-hot encode the tags, turning each unique tag into a binary dimension, but with thousands of unique tags across 24 countries you'd end up with an extremely sparse, high-dimensional space where distance metrics become unreliable. And one-hot encoding throws away the thing that matters: set membership. Two videos sharing 5 out of 8 tags are clearly related. That relationship is obvious when you look at the sets, but it gets buried in a 5000-dimensional binary vector.

I looked for libraries that handled categorical clustering directly. I didn't find anything that worked well for this use case — most approaches either required defining categories upfront or mapped everything to numerical representations first. I needed something that operated directly on sets of tags and understood overlap as similarity.

## The algorithm

I ended up writing my own. It's a hierarchical agglomerative approach — start with individual records, progressively merge similar ones into clusters. Three stages: encoding, initial clustering, and iterative merging.

## Encoding

First, every unique tag across all records gets mapped to an integer. This is a straightforward dimensionality reduction — instead of comparing strings, you compare sets of integers. Faster and memory-friendlier.

Before encoding, a filtering step removes "niche" tags that appear in only one record. A tag unique to a single video can't contribute to any similarity comparison — it will never match anything. Dropping these early keeps the tag space focused on terms that actually connect records. Any record left with no surviving tags after this filter gets dropped entirely.

## Similarity

The core of the algorithm is a modified Jaccard similarity. Standard Jaccard is the size of the intersection divided by the size of the union. My version uses the minimum set size instead of the union:

```python
common_tags = record_a["similarity_tags"] & record_b["similarity_tags"]
similarity = len(common_tags) / min(len(record_a["tags"]), len(record_b["tags"]))
```

This distinction matters. Consider a video with 3 tags `{"music", "live", "concert"}` and another with 20 tags that include those 3. Standard Jaccard gives you 3/20 = 0.15 — barely similar. My metric gives 3/3 = 1.0 — a perfect match from the perspective of the smaller set. The smaller set is completely contained in the larger one.

This was a deliberate choice. In my data, videos about the same topic often had wildly different tag counts. Some creators tag aggressively with 15-20 tags, others use 3-5. A video with `{"euro 2024", "football", "goals"}` is clearly about the same thing as one with `{"euro 2024", "football", "goals", "highlights", "soccer", "championship", "uefa", "europe", "sport", "match"}`. Standard Jaccard would underrate that relationship. Using the minimum set size as the denominator means a small set that's a subset of a larger one still registers as highly similar.

## Iterative merging

The algorithm runs in two phases with different similarity thresholds.

In the first iteration, every record is compared against every other record. Pairs exceeding a `min_similarity_first_iter` threshold get grouped into initial clusters. These initial clusters collect all the tags from their member records — a cluster's tag set is the union of its members' tags.

Then the algorithm switches to cluster-to-cluster comparisons. For two clusters, similarity is the intersection of their tag sets divided by the smaller cluster's tag count. The threshold drops to `min_similarity_next_iters` — typically lower than the first iteration threshold. This is intentional. Initial record-to-record matching needs to be precise to avoid garbage clusters, but once you have established clusters with accumulated tags, you can afford to be more permissive when deciding whether two clusters should merge.

The merge loop repeats: calculate all pairwise cluster similarities, merge the most similar pair, finalize clusters that have no similar matches remaining and meet a minimum size requirement, repeat until nothing is left to merge. Clusters that converge — no more merge candidates above threshold — get emitted as final results.

One property worth noting: records can appear in multiple clusters. This isn't a strict partitioning algorithm. A video tagged with both `{"cooking", "italian", "pasta"}` and `{"travel", "italian", "rome"}` might end up in both a cooking cluster and a travel cluster. For my use case this was a feature, not a bug — a video can genuinely belong to multiple trend groups.

In production, I ran this at three time granularities with different thresholds. Daily clusters used 0.35 for the first iteration and 0.25 for subsequent ones — loose enough to catch fast-moving trends. Weekly clusters tightened the first threshold to 0.45, monthly to 0.55. Longer time windows accumulate more data, so you need stricter initial matching to avoid everything collapsing into one mega-cluster. The subsequent threshold stayed at 0.25 across all three — once clusters are established, the merge tolerance can stay consistent.

After clustering, a final filter enforced the arbitrage requirement: only keep clusters containing videos from at least two different countries. Single-country clusters, no matter how well-formed, weren't useful for cross-border trend detection.

## What survived

The website ran for a while but eventually died — the infrastructure costs weren't justified for what was ultimately a side project. The data pipelines, the scraping infrastructure, the LibreTranslate setup, the GPT-powered cluster summaries — all gone.

But the clustering algorithm turned out to be useful beyond YouTube. It works on any data where records have sets of categorical attributes and you want to find groups with significant overlap. I extracted it into a standalone Python package.

```
pip install categorical-cluster
```

It takes three parameters: `min_similarity_first_iter`, `min_similarity_next_iters`, and `min_elements_in_cluster`. Feed it a list of tag sets, tune the thresholds, and it returns clusters. No numerical encoding required, no distance metric gymnastics, no predefined number of clusters.

[Source on GitHub.](https://github.com/bajor/categorical-cluster)

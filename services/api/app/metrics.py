from collections import Counter

_counters: Counter = Counter()
_lat_sum: dict[str, float] = {}
_lat_n: dict[str, int] = {}

def inc(route: str):
    _counters[f"req_{route}"] += 1

def observe(route: str, seconds: float):
    _lat_sum[route] = _lat_sum.get(route, 0.0) + seconds
    _lat_n[route] = _lat_n.get(route, 0) + 1

def render_prometheus() -> str:
    lines = []
    for k, v in sorted(_counters.items()):
        lines.append(f'companybrain_{k} {v}')
    for r in sorted(_lat_n):
        avg = _lat_sum[r] / max(_lat_n[r], 1)
        lines.append(f'companybrain_lat_avg{{route="{r}"}} {avg:.4f}')
    lines.append('companybrain_up 1')
    return "\n".join(lines) + "\n"

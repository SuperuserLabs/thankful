from datetime import timedelta
from collections import defaultdict
from typing import Dict


class Creator(dict):
    def __init__(self, name, *args,
                 timespent: timedelta = timedelta(0),
                 rating: float = 0.0,
                 donations: dict = dict(),
                 **kwargs) -> None:
        self.name = name
        self.timespent = timespent
        self.rating = rating
        self._donations = donations
        dict.__init__(self, *args, **kwargs)

    def expected_costs(self) -> float:
        # Assume everyone has costs of $1000/mo for now
        return 1000

    def expected_earnings(self) -> float:
        return round(self.expected_revenue() - self.expected_costs())

    def expected_revenue(self) -> float:
        return round(self._expected_revenue_ads() + self._expected_revenue_donations())

    def _expected_revenue_ads(self, cpm=0.25) -> float:
        """
            A conservative estimate of monthly income from ads
             - https://socialblade.com/youtube/youtube-money-calculator
        """
        if "daily_views" in self:
            return 31 * cpm * self["daily_views"] / 1e4
        return 0

    def _expected_revenue_donations(self) -> float:
        """
            A highly speculative calculator of expected monhtly income from donations
        """
        subs = self.subscribers
        income = 0.0
        if "YouTube" in subs:
            income += subs.pop("YouTube") * 0.01  # A YouTuber should be able to get 0.01$ in donations per subscriber, on average
        income += sum(subs.values()) * 0.001  # Subscribers on other platforms of unknown value
        income += self.donations["USD"]
        return income

    def weight(self, total_timespent=None) -> float:
        timespent_frac = (self.timespent.total_seconds() / total_timespent.total_seconds()) \
            if total_timespent else 1
        weight = (2 * max(0, self.rating - 0.5)) * timespent_frac
        return round(weight, 3)

    @property
    def donations(self) -> Dict[str, float]:
        # Can include:
        #   - Average monthly Patreon donations for creators
        #   - Salary for employees
        donations: Dict[str, float] = defaultdict(lambda: 0.0)
        donations.update(self._donations)
        return donations

    @property
    def subscribers(self) -> Dict[str, float]:
        subscribers: Dict[str, float] = defaultdict(lambda: 0)
        subscribers.update(self["subscribers"] if "subscribers" in self else {})
        return subscribers


# Some example data
creators = [
    Creator(name="Erik", subscribers={"YouTube": 500}, donations={"USD": 1000 + 8}, rating=0.7, timespent=timedelta(minutes=120)),
    Creator(name="Johan", donations={"USD": 1000}, rating=0.8, timespent=timedelta(minutes=120)),
    Creator(name="Ahn", donations={"USD": 1000}, rating=0.9, timespent=timedelta(minutes=120)),
    Creator(name="Pewdiepie", subscribers={"YouTube": 63e6}, donations={"USD": 10000}, rating=0.5, timespent=timedelta(minutes=120), daily_views=4000000),
]


def main():
    monthly_budget = 10

    total_weight = sum(c.weight() for c in creators)

    for creator in creators:
        print(f"{creator.name:12} (w: {creator.weight():3},  donations: {dict(creator.donations)})")
        print(f" - E(revenue):   ${creator.expected_revenue()}")
        print(f" - E(earnings):  ${creator.expected_earnings()}")

        allocated = round(monthly_budget * creator.weight() / total_weight, 1)
        print(f" - Allocated:    ${allocated}\n")


if __name__ == "__main__":
    main()

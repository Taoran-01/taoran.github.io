#include <cmath>
#include <cstdio>
#include <cstring>
#include <iostream>
#include <vector>
using namespace std;
typedef long long ll;

char buf[1<<20], *p1, *p2;
#define getchar() (p1==p2&&(p2=(p1=buf)+fread(buf,1,1<<20,stdin),p1==p2)?0:*p1++)

inline ll read() {
	ll x=0, f=1; char ch=getchar();
	while (ch<'0'||ch>'9') {if (ch=='-') f=-1; ch=getchar();}
	while (ch>='0'&&ch<='9') x=(x<<1)+(x<<3)+(ch^48), ch=getchar();
	return x*f;
}

#define N 2000010
int n, m;
int l, r, x;
int a[N], ans[N];

struct node {int id, x, val;};
vector<node> c[N];
vector<node>::iterator it;

template <typename T> struct BIT {
	T c[N]; int lowbit(int x) {return x&(~x+1);}
	void modify(int x, T k) {while (x<=n) c[x]=c[x]+k, x+=lowbit(x);}
	T g(int x) {T ans=T(); while (x>0) ans=ans+c[x], x-=lowbit(x); return ans;}
	T query(int x) {return g(x);} T query(int l, int r) {return g(r)-g(l-1);}
}; BIT<int> ta;

signed main() {
	// freopen("a.in", "r", stdin);
	n=read(), m=read();
	for (int i=1; i<=n; ++i) a[i]=read();
	for (int i=1; i<=m; ++i) {
		l=read(), r=read(), x=read();
		c[l-1].push_back({i, x, -1});
		c[r].push_back({i, x, 1});
	}
	for (int i=1; i<=n; ++i) {
		ta.modify(a[i], 1);
		for (it=c[i].begin(); it!=c[i].end(); ++it) {
			ans[(*it).id]+=(*it).val*ta.query((*it).x);
		}
	}
	for (int i=1; i<=m; ++i) printf("%d\n", ans[i]);
	return 0;
}

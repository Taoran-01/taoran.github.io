#include <cmath>
#include <cstdio>
#include <cstring>
#include <iostream>
#include <vector>
#include <algorithm>
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

#define N 500010
#define M 500010
int n, m; // n modifications & m queries in total.

namespace tdpc {
	int n, ans[M], X[N+(M<<2)], Y[N+(M<<2)], nx, ny; // n points in total.
	struct node {int x, y, id, val;} p[N+(M<<2)]; // M: val=0 | Q: val=+-1
	bool operator<(node a, node b) {return a.x==b.x?abs(a.val)<abs(b.val):a.x<b.x;}
	template <typename T> struct BIT {
		T c[N]; int lowbit(int x) {return x&(~x+1);}
		void modify(int x, T k) {while (x<=n) c[x]=c[x]+k, x+=lowbit(x);}
		T g(int x) {T ans=T(); while (x>0) ans=ans+c[x], x-=lowbit(x); return ans;}
		T query(int x) {return g(x);} T query(int l, int r) {return g(r)-g(l-1);}
	}; BIT<int> ta;
	void np(int x, int y, int id, int val) { // Make a new point.
		p[++n]={x, y, id, val}, X[n]=x, Y[n]=y;
	}
	void set_point(int x, int y) {np(x, y, 0, 0);}
	void set_query(int id, int x1, int y1, int x2, int y2) {
		if (x1>x2) swap(x1, x2); if (y1>y2) swap(y1, y2);
		np(x2, y2, id, 1), np(x1-1, y1-1, id, 1);
		np(x2, y1-1, id, -1), np(x1-1, y2, id, -1);
	}
	void process() {
		sort(X+1, X+n+1), nx=unique(X+1, X+n+1)-X-1;
		sort(Y+1, Y+n+1), ny=unique(Y+1, Y+n+1)-Y-1;
		for (int i=1; i<=n; ++i) {
			p[i].x=lower_bound(X+1, X+nx+1, p[i].x)-X;
			p[i].y=lower_bound(Y+1, Y+ny+1, p[i].y)-Y;
		}
		sort(p+1, p+n+1);
		for (int i=1; i<=n; ++i) {
			if (p[i].val==0) {ta.modify(p[i].y, 1); continue;}
			ans[p[i].id]+=p[i].val*ta.query(p[i].y);
		}
	}
}

signed main() {
	// freopen("b.in", "r", stdin);
	n=read(), m=read();
	for (int i=1; i<=n; ++i) {
		int x=read(), y=read();
		tdpc::set_point(x, y);
	}
	for (int i=1; i<=m; ++i) {
		int x1=read(), y1=read(), x2=read(), y2=read();
		tdpc::set_query(i, x1, y1, x2, y2);
	}
	tdpc::process();
	for (int i=1; i<=m; ++i) printf("%d\n", tdpc::ans[i]);
	return 0;
}

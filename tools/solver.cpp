#include <algorithm>
#include <array>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <iostream>
#include <numeric>
#include <unordered_map>
#include <vector>
using namespace std;
constexpr int MAXN=8;
constexpr int64_t SCALE=1LL<<28;
struct Key { array<int64_t,MAXN> a; bool operator==(const Key&o)const{return a==o.a;} };
struct Hash{size_t operator()(Key const &k)const{uint64_t h=0x123456789abcdef;for(auto x:k.a){uint64_t z=(uint64_t)x+0x9e3779b97f4a7c15ULL;z=(z^(z>>30))*0xbf58476d1ce4e5b9ULL;z=(z^(z>>27))*0x94d049bb133111ebULL;z^=z>>31;h^=z+0x9e3779b97f4a7c15ULL+(h<<6)+(h>>2);}return h;}};
struct Edge{int a,b;};
int n,m,depthCap; int64_t target;vector<Edge> edges;uint64_t countVisits;vector<int> sol,cur;unordered_map<Key,int,Hash> seen;int memoMin=3;
bool dfs(Key &s,int rem,int last){
 countVisits++;
 int hi=0;int64_t mn=s.a[0],mx=0; long double potential=0;
 for(int i=0;i<n;i++){hi+=s.a[i]>target;mn=min(mn,s.a[i]);mx=max(mx,s.a[i]);}
 if(!hi){sol=cur;return true;}
 if(rem<hi || !rem) return false;
 // Every high vertex needs a minimum number of contacts even with an inexhaustible supply of the current minimum.
 int needed=0;
 for(int i=0;i<n;i++)if(s.a[i]>target){int touches=0;int64_t v=s.a[i];while(v>target&&touches<=rem){v=(v+mn)/2;touches++;}needed+=touches;}
 if((needed+1)/2>rem) return false; // Each move touches at most two vertices, so ceil(total minimum contacts / 2) is a safe bound.
 Key memoKey=s; memoKey.a[MAXN-1]=last;
 if(rem>=memoMin){auto it=seen.find(memoKey);if(it!=seen.end()&&it->second>=rem)return false;}
 struct Move{int e;int64_t max;long double var;};vector<Move> cand;
 for(int e=0;e<m;e++){
  auto [a,b]=edges[e];if(s.a[a]==s.a[b])continue;
  // Adjacent independent operations commute; choose their index order.
  if(last>=0&&e<last){auto [c,d]=edges[last];if(a!=c&&a!=d&&b!=c&&b!=d)continue;}
  int64_t av=(s.a[a]+s.a[b])/2;int64_t nex=0;long double variance=0;
  for(int i=0;i<n;i++){int64_t v=(i==a||i==b)?av:s.a[i];nex=max(nex,v);variance+=(long double)v*v;}
  cand.push_back({e,nex,variance});
 }
 sort(cand.begin(),cand.end(),[](const Move&a,const Move&b){return a.max==b.max?a.var<b.var:a.max<b.max;});
 for(auto move:cand){auto [a,b]=edges[move.e];auto oa=s.a[a],ob=s.a[b];s.a[a]=s.a[b]=(oa+ob)/2;cur.push_back(move.e);bool ok=dfs(s,rem-1,move.e);cur.pop_back();s.a[a]=oa;s.a[b]=ob;if(ok)return true;}
 if(rem>=memoMin&&seen.size()<5000000) seen[memoKey]=rem;
 return false;
}
int main(){
 double t;cin>>n>>m>>t>>depthCap;target=llround(t*100)*SCALE;Key start{};for(int i=0;i<n;i++){double v;cin>>v;start.a[i]=llround(v*100)*SCALE;}for(int i=0;i<m;i++){int a,b;cin>>a>>b;edges.push_back({a,b});}
 for(int dep=0;dep<=depthCap;dep++){seen.clear();cur.clear();countVisits=0;auto before=chrono::steady_clock::now();bool ok=dfs(start,dep,-1);auto ms=chrono::duration_cast<chrono::milliseconds>(chrono::steady_clock::now()-before).count();cerr<<"depth="<<dep<<" visits="<<countVisits<<" memo="<<seen.size()<<" ms="<<ms<<" solved="<<ok<<"\n";if(ok){cout<<"minimum "<<sol.size()<<"\n";for(int e:sol)cout<<e<<" ";cout<<"\n";Key s=start;for(int e:sol){auto[a,b]=edges[e];s.a[a]=s.a[b]=(s.a[a]+s.a[b])/2;}for(int i=0;i<n;i++)cout<<(long double)s.a[i]/SCALE/100<<" ";cout<<"\n";return 0;}}
 cout<<"unsolved\n";
}

#include <array>
#include <cstdint>
#include <iostream>
#include <unordered_map>
#include <vector>
#include <chrono>
using namespace std;
constexpr int64_t SCALE=1LL<<30;
struct State{array<int64_t,7>a{};bool operator==(State const&o)const{return a==o.a;}};
struct Hash{size_t operator()(State const&s)const{uint64_t h=0;for(auto x:s.a){uint64_t y=x+0x9e3779b97f4a7c15ULL;y=(y^(y>>30))*0xbf58476d1ce4e5b9ULL;y=(y^(y>>27))*0x94d049bb133111ebULL;y^=y>>31;h^=y+0x9e3779b97f4a7c15ULL+(h<<6)+(h>>2);}return h;}};
int n,m,D;int64_t target;vector<pair<int,int>>edges;unordered_map<State,uint8_t,Hash> memo;uint64_t visits=0;vector<int> path,solution;
bool search(State&s,int rem){
 visits++;
 int unsafe=0;for(int i=0;i<n;i++)unsafe+=s.a[i]>target;
 if(!unsafe){solution=path;return true;}
 if(rem<unsafe) return false; // one averaging move can remove at most one unsafe vertex
 if(rem>2){auto i=memo.find(s);if(i!=memo.end()&&i->second>=rem)return false;}
 for(int e=0;e<m;e++){
  auto[a,b]=edges[e];auto x=s.a[a],y=s.a[b];if(x==y)continue;
  s.a[a]=s.a[b]=(x+y)/2;path.push_back(e);bool found=search(s,rem-1);path.pop_back();s.a[a]=x;s.a[b]=y;if(found)return true;
 }
 if(rem>2&&memo.size()<3000000)memo[s]=rem;
 return false;
}
int main(){int T;cin>>n>>m>>T>>D;target=T*SCALE;State s;for(int i=0;i<n;i++){int v;cin>>v;s.a[i]=v*SCALE;}for(int i=0;i<m;i++){int a,b;cin>>a>>b;edges.push_back({a,b});}auto t=chrono::steady_clock::now();bool yes=search(s,D);auto ms=chrono::duration_cast<chrono::milliseconds>(chrono::steady_clock::now()-t).count();cout<<"{\"depth\":"<<D<<",\"solutionFound\":"<<(yes?"true":"false")<<",\"visitedStates\":"<<visits<<",\"memoizedStates\":"<<memo.size()<<",\"milliseconds\":"<<ms<<",\"sequence\":[";for(size_t i=0;i<solution.size();i++){if(i)cout<<',';cout<<solution[i];}cout<<"]}\n";}

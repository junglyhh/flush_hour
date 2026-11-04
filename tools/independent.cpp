// Independent budget-limited exact search. C++17; no third-party dependencies.
// No commuting-edge restrictions and no prefix-state breadth-first machinery.
// --general disables the monotone-path failure-dominance optimization.
#include <algorithm>
#include <array>
#include <chrono>
#include <cstdint>
#include <iostream>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>
using namespace std;
constexpr int64_t UNIT=int64_t{1}<<40;
struct State {
    array<int64_t,7> values{};
    bool operator==(const State& other) const { return values==other.values; }
};
struct Hash {
    size_t operator()(const State& state) const {
        uint64_t h=0;
        for (auto value : state.values) {
            uint64_t x=uint64_t(value)+0x9e3779b97f4a7c15ULL;
            x=(x^(x>>30))*0xbf58476d1ce4e5b9ULL; x=(x^(x>>27))*0x94d049bb133111ebULL; x^=x>>31;
            h^=x+0x9e3779b97f4a7c15ULL+(h<<6)+(h>>2);
        }
        return h;
    }
};
int n,budget; int64_t limit;
vector<pair<int,int>> edges;
vector<int> path,witness,orderedEdges;
unordered_map<State,uint8_t,Hash> failedStates;
vector<vector<State>> failedPathStates;
uint64_t visits=0,dominanceChecks=0,dominancePrunes=0;

int64_t exactDecimal(const string& token) {
    uint64_t value=0; int decimals=-1; bool digit=false;
    for (char c : token) {
        if (c=='.' && decimals==-1) { decimals=0; continue; }
        if (c<'0' || c>'9') throw runtime_error("Invalid decimal percentage.");
        digit=true; value=10*value+(c-'0');
        if (decimals>=0) ++decimals;
        if (value>10000 || decimals>2) throw runtime_error("Unsupported percentage precision or range.");
    }
    if (!digit) throw runtime_error("Missing percentage.");
    if (decimals<0) decimals=0;
    while (decimals++<2) value*=10;
    if (value>10000) throw runtime_error("Percentage exceeds 100.");
    return int64_t(value)*UNIT;
}
bool ordinarySearch(State& state,int remaining) {
    ++visits;
    int unsafe=0; for (int i=0; i<n; ++i) unsafe+=state.values[i]>limit;
    if (!unsafe) { witness=path; return true; }
    if (unsafe>remaining) return false;
    if (remaining>2) {
        auto it=failedStates.find(state); if (it!=failedStates.end() && it->second>=remaining) return false;
    }
    for (int edge=0; edge<int(edges.size()); ++edge) {
        auto [a,b]=edges[edge]; auto x=state.values[a],y=state.values[b]; if (x==y) continue;
        state.values[a]=state.values[b]=(x+y)/2; path.push_back(edge);
        bool found=ordinarySearch(state,remaining-1);
        path.pop_back(); state.values[a]=x; state.values[b]=y;
        if (found) return true;
    }
    if (remaining>2 && failedStates.size()<3000000) failedStates[state]=uint8_t(remaining);
    return false;
}
// Validate a real simple path, traverse its edges, and orient its physical
// values in descending order. Witnesses always use the ORIGINAL edge indices.
bool preparePath(const State& initial,State& ordered) {
    if (int(edges.size())!=n-1) return false;
    vector<vector<pair<int,int>>> links(n);
    for (int e=0; e<int(edges.size()); ++e) {
        auto [a,b]=edges[e]; links[a].push_back({b,e}); links[b].push_back({a,e});
    }
    vector<int> endpoints;
    for (int v=0; v<n; ++v) {
        if (links[v].size()==1) endpoints.push_back(v);
        else if (links[v].size()!=2) return false;
    }
    if (endpoints.size()!=2) return false;
    vector<int> order,edgeMap; vector<bool> seen(n,false);
    int current=endpoints[0],previous=-1;
    while (!seen[current]) {
        seen[current]=true; order.push_back(current);
        int next=-1,edge=-1;
        for (auto [v,e] : links[current]) if (v!=previous) { next=v; edge=e; }
        if (next<0) break;
        edgeMap.push_back(edge); previous=current; current=next;
    }
    if (int(order.size())!=n) return false;
    bool ascending=true,descending=true;
    for (int i=1; i<n; ++i) {
        ascending &= initial.values[order[i-1]]<=initial.values[order[i]];
        descending &= initial.values[order[i-1]]>=initial.values[order[i]];
    }
    if (!ascending && !descending) return false;
    if (!descending) { reverse(order.begin(),order.end()); reverse(edgeMap.begin(),edgeMap.end()); }
    for (int i=0; i<n; ++i) ordered.values[i]=initial.values[order[i]];
    orderedEdges=move(edgeMap); return true;
}
bool betterPrefixes(const State& better,const State& worse) {
    ++dominanceChecks; int64_t a=0,b=0;
    for (int i=0; i<n-1; ++i) {
        a+=better.values[i]; b+=worse.values[i]; if (a>b) return false;
    }
    return true;
}
bool pathSearch(State& state,int remaining) {
    ++visits;
    if (state.values[0]<=limit) { witness=path; return true; }
    int unsafe=0; for (int i=0; i<n; ++i) unsafe+=state.values[i]>limit;
    if (unsafe>remaining) return false;
    // Failure of a better state at the same budget implies failure here.
    // Both states have an unrestricted action set: there is no last-edge rule.
    for (const State& known : failedPathStates[remaining]) if (betterPrefixes(known,state)) {
        ++dominancePrunes; return false;
    }
    vector<int> choices;
    for (int i=0; i+1<n; ++i) if (state.values[i]!=state.values[i+1]) choices.push_back(i);
    sort(choices.begin(),choices.end(),[&](int a,int b) {
        auto x=state.values[a]-state.values[a+1],y=state.values[b]-state.values[b+1];
        return x==y?a<b:x>y;
    });
    for (int i : choices) {
        auto a=state.values[i],b=state.values[i+1]; state.values[i]=state.values[i+1]=(a+b)/2;
        path.push_back(orderedEdges[i]); bool found=pathSearch(state,remaining-1); path.pop_back();
        state.values[i]=a; state.values[i+1]=b; if (found) return true;
    }
    auto& failures=failedPathStates[remaining];
    failures.erase(remove_if(failures.begin(),failures.end(),[&](const State& prior) {
        return betterPrefixes(state,prior);
    }),failures.end());
    failures.push_back(state); return false;
}
int main(int argc,char** argv) {
    try {
        bool generalOnly=argc==2 && string(argv[1])=="--general";
        if (argc>1 && !generalOnly) throw runtime_error("Only --general is supported.");
        int m; string text;
        if (!(cin>>n>>m>>text>>budget) || n<2 || n>7 || m<1 || m>n*(n-1)/2 || budget<0 || budget>40)
            throw runtime_error("Expected 2-7 vertices, a simple graph, and a 0-40 move budget.");
        limit=exactDecimal(text); State initial;
        for (int i=0; i<n; ++i) {
            if (!(cin>>text)) throw runtime_error("Missing initial percentage.");
            initial.values[i]=exactDecimal(text);
        }
        for (int e=0; e<m; ++e) {
            int a,b; if (!(cin>>a>>b) || a<0 || b<0 || a>=n || b>=n || a==b) throw runtime_error("Invalid edge.");
            for (auto [c,d] : edges)
                if ((a==c && b==d) || (a==d && b==c)) throw runtime_error("Repeated edge.");
            edges.push_back({a,b});
        }
        State ordered; bool usePath=!generalOnly && preparePath(initial,ordered);
        auto started=chrono::steady_clock::now(); bool solved; size_t memoized;
        if (usePath) {
            failedPathStates.resize(budget+1); solved=pathSearch(ordered,budget); memoized=0;
            for (const auto& bucket : failedPathStates) memoized+=bucket.size();
        } else { solved=ordinarySearch(initial,budget); memoized=failedStates.size(); }
        auto ms=chrono::duration_cast<chrono::milliseconds>(chrono::steady_clock::now()-started).count();
        cout<<"{\"depth\":"<<budget<<",\"solutionFound\":"<<(solved?"true":"false")
            <<",\"method\":\""<<(usePath?"path-failure-dominance":"general-exhaustive")<<"\""
            <<",\"visitedStates\":"<<visits<<",\"memoizedStates\":"<<memoized
            <<",\"dominancePrunes\":"<<dominancePrunes<<",\"dominanceComparisons\":"<<dominanceChecks
            <<",\"milliseconds\":"<<ms<<",\"sequence\":[";
        for (size_t i=0; i<witness.size(); ++i) { if (i) cout<<','; cout<<witness[i]; }
        cout<<"]}\n"; return 0;
    } catch (const exception& error) { cerr<<error.what()<<'\n'; return 2; }
}

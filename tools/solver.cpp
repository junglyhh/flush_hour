// Exact shortest solutions for Flush Hour. C++17; no third-party dependencies.
// Input: n m threshold depthCap, n initial percentages, then m endpoint pairs.
// --general disables the monotone-path dominance optimization.
#include <algorithm>
#include <array>
#include <chrono>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>
using namespace std;
constexpr int MAXN = 7, MAX_DEPTH = 40;
constexpr int64_t SCALE = int64_t{1} << MAX_DEPTH;
using Values = array<int64_t, MAXN>;

int64_t percentage(const string& text) {
    auto dot = text.find('.');
    string whole = text.substr(0, dot);
    string fractional = dot == string::npos ? "" : text.substr(dot + 1);
    if (whole.empty() || fractional.size() > 2 ||
        whole.find_first_not_of("0123456789") != string::npos ||
        fractional.find_first_not_of("0123456789") != string::npos)
        throw runtime_error("Percentages need nonnegative decimals with at most two places.");
    while (fractional.size() < 2) fractional += '0';
    int64_t integral = stoll(whole);
    if (integral > 100) throw runtime_error("Percentage exceeds 100.");
    int64_t cents = integral * 100 + stoll(fractional);
    if (cents > 10000) throw runtime_error("Percentage exceeds 100.");
    return cents * SCALE;
}
struct Problem {
    int n = 0, cap = 0;
    int64_t target = 0;
    Values initial{};
    vector<pair<int, int>> edges;
};
Problem readProblem() {
    Problem p; int m; string text;
    if (!(cin >> p.n >> m >> text >> p.cap)) throw runtime_error("Missing problem header.");
    if (p.n < 2 || p.n > MAXN || m < 1 || m > p.n*(p.n-1)/2 || p.cap < 0 || p.cap > MAX_DEPTH)
        throw runtime_error("Supported: 2-7 vertices, a simple graph, and 0-40 moves.");
    p.target = percentage(text);
    for (int i = 0; i < p.n; ++i) {
        if (!(cin >> text)) throw runtime_error("Missing initial value.");
        p.initial[i] = percentage(text);
    }
    for (int e = 0; e < m; ++e) {
        int a, b;
        if (!(cin >> a >> b) || a < 0 || b < 0 || a >= p.n || b >= p.n || a == b)
            throw runtime_error("Invalid edge.");
        for (auto [c,d] : p.edges)
            if ((a == c && b == d) || (a == d && b == c)) throw runtime_error("Repeated edge.");
        p.edges.emplace_back(a,b);
    }
    return p;
}
struct PathOrder { vector<int> vertices, edges; };
// Validate the entire graph and traverse its real edges, including relabelings.
PathOrder monotonePath(const Problem& p) {
    if (int(p.edges.size()) != p.n-1) return {};
    vector<vector<pair<int,int>>> adj(p.n);
    for (int e = 0; e < int(p.edges.size()); ++e) {
        auto [a,b] = p.edges[e]; adj[a].push_back({b,e}); adj[b].push_back({a,e});
    }
    for (const auto& neighbors : adj) if (neighbors.empty() || neighbors.size()>2) return {};
    for (int start = 0; start < p.n; ++start) if (adj[start].size() == 1) {
        PathOrder order; vector<bool> seen(p.n,false); int previous=-1, current=start;
        while (!seen[current]) {
            seen[current]=true; order.vertices.push_back(current);
            int next=-1, edge=-1;
            for (auto [a,e] : adj[current]) if (a != previous) { next=a; edge=e; break; }
            if (next<0) break;
            order.edges.push_back(edge); previous=current; current=next;
        }
        if (int(order.vertices.size()) != p.n) continue;
        bool descending=true;
        for (int i=1; i<p.n; ++i)
            if (p.initial[order.vertices[i-1]] < p.initial[order.vertices[i]]) descending=false;
        if (descending) return order;
    }
    return {};
}
struct Key {
    array<int64_t,MAXN+1> data{};
    bool operator==(const Key& other) const { return data==other.data; }
};
struct Hash {
    size_t operator()(const Key& key) const {
        uint64_t h=0x123456789abcdefULL;
        for (auto value : key.data) {
            uint64_t x=uint64_t(value)+0x9e3779b97f4a7c15ULL;
            x=(x^(x>>30))*0xbf58476d1ce4e5b9ULL; x=(x^(x>>27))*0x94d049bb133111ebULL; x^=x>>31;
            h^=x+0x9e3779b97f4a7c15ULL+(h<<6)+(h>>2);
        }
        return h;
    }
};
class GeneralSearch {
    const Problem& p;
    unordered_map<Key,int,Hash> failed;
    vector<int> current;
    uint64_t visits=0;
    bool search(Values& state, int remaining, int last) {
        ++visits;
        int unsafe=0; int64_t minimum=state[0];
        for (int i=0; i<p.n; ++i) { unsafe+=state[i]>p.target; minimum=min(minimum,state[i]); }
        if (!unsafe) { solution=current; return true; }
        // At most one above-threshold vertex can become safe in one move.
        if (remaining<unsafe) return false;
        int contacts=0;
        for (int i=0; i<p.n; ++i) if (state[i]>p.target) {
            int count=0; int64_t value=state[i];
            while (value>p.target && count<remaining) { value=(value+minimum)/2; ++count; }
            if (value>p.target) return false;
            contacts+=count;
        }
        if ((contacts+1)/2>remaining) return false;
        Key key; copy(state.begin(),state.end(),key.data.begin()); key.data[MAXN]=last;
        if (remaining>=3) {
            auto it=failed.find(key); if (it!=failed.end() && it->second>=remaining) return false;
        }
        struct Move { int edge; int64_t maximum; long double squareSum; };
        vector<Move> moves;
        for (int e=0; e<int(p.edges.size()); ++e) {
            auto [a,b]=p.edges[e]; if (state[a]==state[b]) continue;
            // Adjacent disjoint operations commute. The memo key retains
            // last-edge context so this restriction is never mixed up.
            if (last>=0 && e<last) {
                auto [c,d]=p.edges[last]; if (a!=c && a!=d && b!=c && b!=d) continue;
            }
            auto average=(state[a]+state[b])/2; int64_t maximum=0; long double squares=0;
            for (int i=0; i<p.n; ++i) {
                auto value=(i==a || i==b)?average:state[i];
                maximum=max(maximum,value); squares+=static_cast<long double>(value)*value;
            }
            moves.push_back({e,maximum,squares});
        }
        sort(moves.begin(),moves.end(),[](const Move& a,const Move& b) {
            if (a.maximum!=b.maximum) return a.maximum<b.maximum;
            if (a.squareSum!=b.squareSum) return a.squareSum<b.squareSum;
            return a.edge<b.edge;
        });
        for (auto move : moves) {
            auto [a,b]=p.edges[move.edge]; auto x=state[a],y=state[b];
            state[a]=state[b]=(x+y)/2; current.push_back(move.edge);
            bool found=search(state,remaining-1,move.edge);
            current.pop_back(); state[a]=x; state[b]=y;
            if (found) return true;
        }
        if (remaining>=3 && failed.size()<5000000) failed[key]=remaining;
        return false;
    }
public:
    vector<int> solution;
    explicit GeneralSearch(const Problem& problem):p(problem){}
    bool solve() {
        cerr<<"method=general-exhaustive\n";
        for (int depth=0; depth<=p.cap; ++depth) {
            failed.clear(); current.clear(); visits=0; Values state=p.initial;
            auto started=chrono::steady_clock::now(); bool found=search(state,depth,-1);
            auto ms=chrono::duration_cast<chrono::milliseconds>(chrono::steady_clock::now()-started).count();
            cerr<<"depth="<<depth<<" visits="<<visits<<" memo="<<failed.size()<<" ms="<<ms<<" solved="<<found<<'\n';
            if (found) return true;
        }
        return false;
    }
};
// Frontiers include states reachable in AT MOST depth moves. On a descending
// path, averaging edge i changes prefix i to (prefix i-1 + prefix i+1)/2,
// with boundaries 0 and total. This recurrence preserves componentwise order.
// A smaller prefix vector can therefore replace a larger one for every future
// sequence and for the maximum-value goal (which is the first vertex).
bool solvePath(const Problem& p,const PathOrder& order,vector<int>& solution) {
    struct Node { array<int64_t,MAXN-1> prefix{}; int parent=-1,edge=-1; };
    Node start; int64_t total=0;
    for (int i=0; i<p.n; ++i) {
        total+=p.initial[order.vertices[i]]; if (i<p.n-1) start.prefix[i]=total;
    }
    vector<Node> history{start}; vector<int> frontier{0};
    uint64_t generated=1,comparisons=0;
    auto dominates=[&](const Node& a,const Node& b) {
        ++comparisons;
        for (int i=0; i<p.n-1; ++i) if (a.prefix[i]>b.prefix[i]) return false;
        return true;
    };
    cerr<<"method=path-prefix-dominance\n";
    for (int depth=0; depth<=p.cap; ++depth) {
        cerr<<"depth="<<depth<<" frontier="<<frontier.size()<<" generated="<<generated<<" dominanceComparisons="<<comparisons<<'\n';
        for (int index : frontier) if (history[index].prefix[0]<=p.target) {
            for (int i=index; history[i].parent>=0; i=history[i].parent) solution.push_back(history[i].edge);
            reverse(solution.begin(),solution.end()); return true;
        }
        if (depth==p.cap) break;
        vector<Node> candidates; candidates.reserve(frontier.size()*p.n);
        for (int index : frontier) {
            Node state=history[index]; candidates.push_back(state); // preserve the at-most budget
            for (int i=0; i<p.n-1; ++i) {
                auto next=((i?state.prefix[i-1]:0)+(i+1<p.n-1?state.prefix[i+1]:total))/2;
                if (next==state.prefix[i]) continue;
                Node child=state; child.prefix[i]=next; child.parent=index; child.edge=order.edges[i];
                candidates.push_back(child);
            }
        }
        generated+=candidates.size();
        sort(candidates.begin(),candidates.end(),[](const Node& a,const Node& b){return a.prefix<b.prefix;});
        vector<Node> kept;
        for (const Node& candidate : candidates) {
            bool redundant=false;
            for (const Node& better : kept) if (dominates(better,candidate)) { redundant=true; break; }
            // After lexicographic sorting, a later distinct vector cannot
            // dominate an earlier one, so no backward removal is needed.
            if (!redundant) kept.push_back(candidate);
        }
        frontier.clear();
        for (const Node& node : kept) { frontier.push_back(int(history.size())); history.push_back(node); }
    }
    return false;
}
int main(int argc,char** argv) {
    try {
        bool forceGeneral=argc==2 && string(argv[1])=="--general";
        if (argc>1 && !forceGeneral) throw runtime_error("Only --general is supported.");
        Problem p=readProblem(); auto order=forceGeneral?PathOrder{}:monotonePath(p);
        vector<int> solution; bool found;
        if (!order.vertices.empty()) found=solvePath(p,order,solution);
        else { GeneralSearch search(p); found=search.solve(); solution=search.solution; }
        if (!found) { cout<<"unsolved\n"; return 0; }
        cout<<"minimum "<<solution.size()<<'\n'; Values final=p.initial;
        for (int edge : solution) {
            cout<<edge<<' '; auto [a,b]=p.edges[edge]; final[a]=final[b]=(final[a]+final[b])/2;
        }
        cout<<'\n'<<setprecision(14);
        for (int i=0; i<p.n; ++i) cout<<static_cast<long double>(final[i])/SCALE/100<<' ';
        cout<<'\n'; return 0;
    } catch (const exception& error) { cerr<<error.what()<<'\n'; return 2; }
}
